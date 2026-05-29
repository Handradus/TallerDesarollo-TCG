const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const verifyToken = require('../middleware/auth.middleware');

router.post('/google', authController.googleLogin);
router.post('/accept-eula', verifyToken, authController.acceptEula);

// Admin routes for approval flow
router.get('/pending-users', verifyToken, authController.getPendingUsers);
router.post('/approve/:id', verifyToken, authController.approveUser);

router.get('/banned-users', verifyToken, authController.getBannedUsers);
router.post('/ban/:id', verifyToken, authController.banUser);
router.post('/unban/:id', verifyToken, authController.unbanUser);

module.exports = router;
