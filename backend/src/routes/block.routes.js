const express = require('express');
const router = express.Router();
const blockController = require('../controllers/block.controller');
const verifyToken = require('../middleware/auth.middleware');

router.use(verifyToken);
router.post('/', blockController.blockUser);
router.delete('/:blockedId', blockController.unblockUser);
router.get('/', blockController.getBlockedUsers);
router.get('/status/:targetId', blockController.checkBlockStatus);

module.exports = router;
