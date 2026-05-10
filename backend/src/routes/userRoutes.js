const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Récupérer le profil public d'un utilisateur
router.get('/:userId', authMiddleware, userController.getUserProfile);

module.exports = router;
