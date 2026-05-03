const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const verifyToken = require('../middleware/auth.middleware');

router.post('/google', authController.googleLogin);

// Admin routes for approval flow
router.get('/pending-users', verifyToken, authController.getPendingUsers);
router.post('/approve/:id', verifyToken, authController.approveUser);

module.exports = router;
