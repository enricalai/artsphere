const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Signalement par un utilisateur connecté
router.post('/', authMiddleware, adminController.createReport);

module.exports = router;