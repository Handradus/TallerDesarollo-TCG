const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const verifyToken = require('../middleware/auth.middleware');

// Public
router.get('/:userId', profileController.getProfile);

// Protected
router.use(verifyToken);
router.put('/me', profileController.updateProfile);
router.put('/me/password', profileController.updatePassword);
router.post('/comment', profileController.addComment);
router.post('/comment/:commentId/report', profileController.reportComment);

module.exports = router;
