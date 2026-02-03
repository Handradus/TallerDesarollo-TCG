const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { AppDataSource } = require('../data-source');
const User = require('../entities/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const userRepository = AppDataSource.getRepository(User);

const googleLogin = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name;
        const picture = payload.picture;

        let user = await userRepository.findOneBy({ googleId });

        if (!user) {
            user = userRepository.create({
                googleId,
                email,
                name,
                picture,
                role: email === 'softguaren@gmail.com' ? 'admin' : 'user'
            });
            await userRepository.save(user);
        } else {
            // Update user info if changed
            user.name = name;
            user.picture = picture;
            // Ensure admin role is preserved or granted if matching email
            if (email === 'softguaren@gmail.com' && user.role !== 'admin') {
                user.role = 'admin';
            }
            await userRepository.save(user);
        }

        // Create JWT
        const jwtToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role }, // Include role in JWT
            process.env.JWT_SECRET || 'secret_key_change_me',
            { expiresIn: '7d' }
        );

        res.json({
            token: jwtToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                picture: user.picture,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = {
    googleLogin,
};
