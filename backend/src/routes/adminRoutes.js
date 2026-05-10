const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Toutes ces routes nécessitent authentification + rôle admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard & Statistiques
router.get('/dashboard', adminController.getDashboardStats);

// Gestion des utilisateurs
router.get('/users', adminController.getAllUsers);
router.put('/users/suspend/:userId', adminController.suspendUser);
router.put('/users/unsuspend/:userId', adminController.unsuspendUser);

// Gestion des administrateurs
router.post('/admins', adminController.createAdmin);

// Gestion des signalements
router.get('/reports', adminController.getAllReports);
router.post('/reports', adminController.createReport);
router.put('/reports/:reportId/resolve', adminController.resolveReport);

// Gestion des œuvres
router.delete('/artworks/:artworkId', adminController.adminDeleteArtwork);

module.exports = router;