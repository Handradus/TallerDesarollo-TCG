const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collection.controller');
const verifyToken = require('../middleware/auth.middleware');

router.use(verifyToken);

router.post('/add', collectionController.addToCollection);
router.post('/remove', collectionController.removeFromCollection);
router.get('/', collectionController.getCollection);
router.put('/item/:id', collectionController.updateCollectionItem);

// Binder Routes
router.post('/binders', collectionController.createBinder);
router.get('/binders', collectionController.getBinders);
router.delete('/binders/:id', collectionController.deleteBinder);

module.exports = router;
