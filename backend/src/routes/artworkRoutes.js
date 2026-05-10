const express = require('express');
const router = express.Router();
const artworkController = require('../controllers/artworkController');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Routes publiques
router.get('/', artworkController.getAllArtworks);
router.get('/:id', artworkController.getArtworkById);

// Routes protégées
router.post('/', authMiddleware, upload.single('image'), artworkController.createArtwork);
router.put('/:id', authMiddleware, artworkController.updateArtwork);
router.delete('/:id', authMiddleware, artworkController.deleteArtwork);

module.exports = router;