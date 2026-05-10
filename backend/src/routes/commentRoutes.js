const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');

// Routes publiques
router.get('/artwork/:artworkId', commentController.getCommentsByArtwork);

// Routes protégées
router.post('/artwork/:artworkId', authMiddleware, commentController.addComment);
router.delete('/:commentId', authMiddleware, commentController.deleteComment);

module.exports = router;