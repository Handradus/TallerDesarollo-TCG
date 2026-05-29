const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { AppDataSource } = require('../data-source');
const User = require('../entities/User');
const { hashPassword, verifyPassword } = require('../helpers/crypto.helper');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const userRepository = AppDataSource.getRepository(User);

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await userRepository.findOneBy({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Verify password
        const isPasswordCorrect = verifyPassword(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
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
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                picture: user.picture,
                role: user.role,
                themeColor: user.themeColor,
            },
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Error interno en el servidor' });
    }
};

const register = async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const existingUser = await userRepository.findOneBy({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'El correo electrónico ya está en uso' });
        }

        const isFirstAdmin = email.toLowerCase() === 'softguaren@gmail.com' || email.toLowerCase() === 'admin@admin.com';

        const user = userRepository.create({
            email: email.toLowerCase(),
            password: hashPassword(password),
            name,
            picture: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png', // Ditto default
            role: isFirstAdmin ? 'admin' : 'user',
            approved: isFirstAdmin ? true : false,
        });

        await userRepository.save(user);

        if (!user.approved) {
            return res.status(201).json({ message: 'pending_approval', userId: user.id });
        }

        // If somehow approved automatically
        const jwtToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret_key_change_me',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token: jwtToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                picture: user.picture,
                role: user.role,
                themeColor: user.themeColor,
            },
        });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: 'Error interno al registrar el usuario' });
    }
};

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
            const isAdmin = email === 'softguaren@gmail.com';
            user = userRepository.create({
                googleId,
                email,
                name,
                picture,
                role: isAdmin ? 'admin' : 'user',
                approved: isAdmin ? true : false,
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
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                picture: user.picture,
                role: user.role,
                themeColor: user.themeColor,
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

module.exports = {
    login,
    register,
    googleLogin,
    getPendingUsers,
    approveUser,
    getBannedUsers,
    banUser,
    unbanUser
};
