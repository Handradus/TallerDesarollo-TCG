const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const contactController = require('../controllers/contact.controller');

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_me', (err, user) => {
            if (!err) {
                req.user = user;
            }
            next();
        });
    } else {
        next();
    }
};

router.post('/', optionalAuth, contactController.submitContact);

module.exports = router;
