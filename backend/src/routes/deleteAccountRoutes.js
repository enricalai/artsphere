const express = require('express');
const router = express.Router();
const deleteAccountController = require('../controllers/deleteAccountController');
const authMiddleware = require('../middleware/auth');

router.delete('/', authMiddleware, deleteAccountController.deleteAccount);

module.exports = router;