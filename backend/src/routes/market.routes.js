const express = require('express');
const router = express.Router();
const marketController = require('../controllers/market.controller');
const verifyToken = require('../middleware/auth.middleware');

// Public routes (anyone can search) - optional, but let's keep search public?
// Or maybe verifyToken? Let's make search public but listing private.
router.get('/search', marketController.searchMarket);
router.get('/carta/:cartaId', marketController.getListingsByCarta);

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo imágenes permitidas (jpeg, jpg, png, webp, gif)'));
    }
});

// Protected routes
router.use(verifyToken);
router.post('/list', upload.single('realImage'), marketController.listForSale);
router.get('/mine', marketController.getMyListings);
router.delete('/:id', marketController.deleteResult);

module.exports = router;
