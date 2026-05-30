const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const verifyToken = require('../middleware/auth.middleware');

// Step 1: Verify Google token — login existing users OR return requiresEula for new ones
router.post('/google', authController.googleCheck);
// Step 2: Create account after new user accepts EULA
router.post('/google/register', authController.googleRegister);

router.post('/accept-eula', verifyToken, authController.acceptEula);

// Admin routes for approval flow
router.get('/pending-users', verifyToken, authController.getPendingUsers);
router.post('/approve/:id', verifyToken, authController.approveUser);
router.delete('/reject/:id', verifyToken, authController.rejectUser);

router.get('/banned-users', verifyToken, authController.getBannedUsers);
router.post('/ban/:id', verifyToken, authController.banUser);
router.post('/unban/:id', verifyToken, authController.unbanUser);

module.exports = router;
