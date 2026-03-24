const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');
const { createReport, getPendingReports, resolveReport } = require('../controllers/report.controller');

router.post('/', verifyToken, createReport);
router.get('/pending', verifyToken, getPendingReports);
router.post('/:id/resolve', verifyToken, resolveReport);

module.exports = router;
