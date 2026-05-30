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
        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            const isAdmin = email === 'softguaren@gmail.com';
            user = userRepository.create({
                googleId,
                email,
                name,
                picture,
                role: isAdmin ? 'admin' : 'user',
                approved: isAdmin ? true : false,
                acceptedTerms: true,
                termsAcceptedAt: new Date(),
            });
            await userRepository.save(user);
        } else {
            // Update user info if changed
            user.name = name;
            user.picture = picture;
            // Ensure admin role is preserved or granted if matching email
            if (email === 'softguaren@gmail.com' && user.role !== 'admin') {
                user.role = 'admin';
                user.approved = true;
            }
            await userRepository.save(user);
        }

        // If user is banned, reject login completely
        if (user.banned) {
            return res.status(403).json({ message: 'account_banned', userId: user.id });
        }

        // If user is not approved (and not admin), reject login and inform frontend
        if (!user.approved && user.role !== 'admin') {
            return res.status(403).json({ message: 'pending_approval', userId: user.id });
        }

        // Create JWT
        const jwtToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role }, // Include role in JWT
            process.env.JWT_SECRET || 'secret_key_change_me',
            { expiresIn: '7d' }
        );

        res.json({
            token: jwtToken,
            isNewUser,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                picture: user.picture,
                role: user.role,
                acceptedTerms: user.acceptedTerms,
            },
        });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Admin: list pending users (not approved)
const getPendingUsers = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const users = await userRepository.find({ where: { approved: false, banned: false } });
        const minimal = users.map(u => ({ id: u.id, email: u.email, name: u.name, createdAt: u.createdAt }));
        res.json({ pending: minimal });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal error' });
    }
};

// Admin: approve a user by id
const approveUser = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { id } = req.params;
        const user = await userRepository.findOneBy({ id: parseInt(id) });
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.approved = true;
        await userRepository.save(user);
        res.json({ success: true, user: { id: user.id, email: user.email, approved: user.approved } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal error' });
    }
};

// Admin: get all banned users
const getBannedUsers = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const users = await userRepository.find({ where: { banned: true } });
        const minimal = users.map(u => ({ id: u.id, email: u.email, name: u.name, createdAt: u.createdAt }));
        res.json({ banned: minimal });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal error' });
    }
};

// Admin: ban a user
const banUser = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { id } = req.params;
        const user = await userRepository.findOneBy({ id: parseInt(id) });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Prevent banning other admins for safety
        if (user.role === 'admin') {
             return res.status(403).json({ message: 'Cannot ban an administrator' });
        }

        user.banned = true;
        user.approved = false; // Revoke approval as well
        await userRepository.save(user);
        res.json({ success: true, user: { id: user.id, email: user.email, banned: user.banned } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal error' });
    }
};

// Admin: unban a user
const unbanUser = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { id } = req.params;
        const user = await userRepository.findOneBy({ id: parseInt(id) });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        user.banned = false;
        user.approved = true; // Auto-approve upon unbanning so they can enter immediately
        await userRepository.save(user);
        res.json({ success: true, user: { id: user.id, email: user.email, banned: user.banned } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal error' });
    }
};

// Admin: reject a pending user (delete so they can re-register)
const rejectUser = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { id } = req.params;
        const user = await userRepository.findOneBy({ id: parseInt(id) });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent rejecting admins
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot reject an administrator' });
        }

        await userRepository.remove(user);
        res.json({ success: true, message: 'User rejected and removed. They can re-register.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal error' });
    }
};

// User: accept EULA
const acceptEula = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await userRepository.findOneBy({ id: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.acceptedTerms = true;
        user.termsAcceptedAt = new Date();
        await userRepository.save(user);

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                picture: user.picture,
                role: user.role,
                acceptedTerms: user.acceptedTerms
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal error' });
    }
};

module.exports = {
    googleLogin,
    getPendingUsers,
    approveUser,
    rejectUser,
    getBannedUsers,
    banUser,
    unbanUser,
    acceptEula
};
