const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, upload.single('avatar'), authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);

module.exports = router;