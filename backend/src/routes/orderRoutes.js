const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');

router.post('/buy/:artworkId', authMiddleware, orderController.createOrder);
router.put('/confirm/:orderId', authMiddleware, orderController.confirmOrder);
router.put('/cancel/:orderId', authMiddleware, orderController.cancelOrder);
router.get('/my-orders', authMiddleware, orderController.getMyOrders);
router.get('/my-sales', authMiddleware, orderController.getMySales);
router.put('/refuse/:orderId', authMiddleware, orderController.refuseOrder);
module.exports = router;