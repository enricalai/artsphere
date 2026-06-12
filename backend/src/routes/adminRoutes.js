const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Toutes ces routes nécessitent authentification + rôle admin
router.use(authMiddleware);
router.use(adminMiddleware);

// =============================================
// DASHBOARD & STATISTIQUES
// =============================================
router.get('/dashboard', adminController.getDashboardStats);
router.get('/stats/advanced', adminController.getAdvancedStats);

// =============================================
// GESTION DES UTILISATEURS
// =============================================
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserById);
router.put('/users/suspend/:userId', adminController.suspendUser);
router.put('/users/unsuspend/:userId', adminController.unsuspendUser);
router.delete('/users/:userId', adminController.deleteUser);

// =============================================
// GESTION DES ADMINISTRATEURS
// =============================================
router.get('/admins', adminController.getAllAdmins);
router.post('/admins', adminController.createAdmin);
router.delete('/admins/:adminId', adminController.deleteAdmin);

// =============================================
// GESTION DES SIGNALEMENTS
// =============================================
router.get('/reports', adminController.getAllReports);
router.get('/reports/:reportId', adminController.getReportById);
router.post('/reports', adminController.createReport);
router.put('/reports/:reportId/resolve', adminController.resolveReport);
router.post('/reports/bulk-resolve', adminController.bulkResolveReports);

// =============================================
// GESTION DES ŒUVRES
// =============================================
router.get('/artworks', adminController.getAllArtworks);
router.get('/artworks/:artworkId', adminController.getArtworkById);
router.delete('/artworks/:artworkId', adminController.adminDeleteArtwork);
router.put('/artworks/:artworkId/status', adminController.adminUpdateArtworkStatus);

// =============================================
// GESTION DES COMMANDES
// =============================================
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:orderId/status', adminController.updateOrderStatus);

module.exports = router;