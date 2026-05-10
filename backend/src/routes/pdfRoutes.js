const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateCertificate, testCertificate } = require('../controllers/pdfController');

// Route de test (sans image) - plus légère pour déboguer
router.get('/test/:orderId', auth, testCertificate);

// Route principale (avec tentative d'ajout d'image)
router.get('/certificate/:orderId', auth, generateCertificate);

module.exports = router;