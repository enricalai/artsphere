const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// =============================================
// Routes PUBLIQUES (authentification seule requise)
// =============================================
router.post('/reports', authMiddleware, adminController.createReport);

// =============================================
// DASHBOARD & STATISTIQUES (admin uniquement)
// =============================================
router.get('/dashboard', authMiddleware, adminMiddleware, adminController.getDashboardStats);
router.get('/advanced-stats', authMiddleware, adminMiddleware, adminController.getAdvancedStats);

// =============================================
// GESTION DES UTILISATEURS (admin uniquement)
// =============================================
router.get('/users', authMiddleware, adminMiddleware, adminController.getAllUsers);
router.get('/users/:userId', authMiddleware, adminMiddleware, adminController.getUserById);
router.put('/users/suspend/:userId', authMiddleware, adminMiddleware, adminController.suspendUser);
router.put('/users/unsuspend/:userId', authMiddleware, adminMiddleware, adminController.unsuspendUser);
router.delete('/users/:userId', authMiddleware, adminMiddleware, adminController.deleteUser);

// =============================================
// GESTION DES ADMINISTRATEURS (admin uniquement)
// =============================================
router.get('/admins', authMiddleware, adminMiddleware, adminController.getAllAdmins);
router.post('/admins', authMiddleware, adminMiddleware, adminController.createAdmin);
router.delete('/admins/:adminId', authMiddleware, adminMiddleware, adminController.deleteAdmin);

// =============================================
// GESTION DES SIGNALEMENTS (admin uniquement - visualisation et traitement)
// =============================================
router.get('/reports', authMiddleware, adminMiddleware, adminController.getAllReports);
router.get('/reports/:reportId', authMiddleware, adminMiddleware, adminController.getReportById);
router.put('/reports/:reportId/resolve', authMiddleware, adminMiddleware, adminController.resolveReport);
router.post('/reports/bulk-resolve', authMiddleware, adminMiddleware, adminController.bulkResolveReports);

// =============================================
// GESTION DES ŒUVRES (admin uniquement)
// =============================================
router.get('/artworks', authMiddleware, adminMiddleware, adminController.getAllArtworks);
router.get('/artworks/:artworkId', authMiddleware, adminMiddleware, adminController.getArtworkById);
router.delete('/artworks/:artworkId', authMiddleware, adminMiddleware, adminController.adminDeleteArtwork);
router.put('/artworks/:artworkId/status', authMiddleware, adminMiddleware, adminController.adminUpdateArtworkStatus);

// =============================================
// GESTION DES COMMANDES (admin uniquement)
// =============================================
router.get('/orders', authMiddleware, adminMiddleware, adminController.getAllOrders);
router.put('/orders/:orderId/status', authMiddleware, adminMiddleware, adminController.updateOrderStatus);

module.exports = router;