// reportRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Route publique - Tout utilisateur authentifié peut signaler
router.post('/', authMiddleware, adminController.createReport);

module.exports = router;