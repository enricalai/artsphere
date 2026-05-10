const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const authMiddleware = require('../middleware/auth');

// Toutes les routes des likes nécessitent d'être connecté
router.post('/:artworkId', authMiddleware, likeController.addLike);
router.delete('/:artworkId', authMiddleware, likeController.removeLike);
router.get('/:artworkId/check', authMiddleware, likeController.checkLike);

module.exports = router;