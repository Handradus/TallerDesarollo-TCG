const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const verifyToken = require('../middleware/auth.middleware');

router.use(verifyToken);
router.post('/send', messageController.sendMessage);
router.get('/', messageController.getMyMessages);
router.get('/unread', messageController.getUnreadCount); // Must be before /:id/read if conflict, but here structure is safe
router.put('/:id/read', messageController.markAsRead);

module.exports = router;
