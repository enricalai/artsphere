const db = require('../config/db');
const notificationController = require('./notificationController');

// ========== MES COMMANDES (acheteur) ==========
exports.getMyOrders = async (req, res) => {
    const userId = req.user.id;
    
    try {
        const [orders] = await db.query(
            `SELECT o.*, a.title as artwork_title, a.image_url 
             FROM orders o
             JOIN artworks a ON o.artwork_id = a.id
             WHERE o.buyer_id = ?
             ORDER BY o.order_date DESC`,
            [userId]
        );
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// ========== MES VENTES (artiste) ==========
exports.getMySales = async (req, res) => {
    const userId = req.user.id;
    
    try {
        const [sales] = await db.query(
            `SELECT o.*, a.title as artwork_title, a.image_url, u.nom as buyer_name
             FROM orders o
             JOIN artworks a ON o.artwork_id = a.id
             JOIN users u ON o.buyer_id = u.id
             WHERE a.user_id = ?
             ORDER BY o.order_date DESC`,
            [userId]
        );
        res.json(sales);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// ========== CRÉER UNE COMMANDE ==========
exports.createOrder = async (req, res) => {
    const { artworkId } = req.params;
    const buyerId = req.user.id;
    
    try {
        const [artworks] = await db.query(
            `SELECT a.*, u.id as seller_id 
             FROM artworks a
             JOIN users u ON a.user_id = u.id
             WHERE a.id = ? AND a.is_sold = FALSE AND a.is_available = TRUE`,
            [artworkId]
        );
        
        if (artworks.length === 0) {
            return res.status(404).json({ error: 'Œuvre non trouvée, indisponible ou déjà vendue' });
        }
        
        const artwork = artworks[0];
        
        if (artwork.seller_id === buyerId) {
            return res.status(400).json({ error: 'Vous ne pouvez pas acheter votre propre œuvre' });
        }
        
        const [result] = await db.query(
            `INSERT INTO orders (buyer_id, artwork_id, amount, status) 
             VALUES (?, ?, ?, 'pending')`,
            [buyerId, artworkId, artwork.price]
        );
        
        // 🔔 Notification à l'artiste
        await notificationController.createNotification(
            artwork.seller_id,
            'order',
            `${req.user.nom} a acheté votre œuvre "${artwork.title}"`,
            artworkId
        );
        
        res.status(201).json({
            message: 'Commande créée avec succès',
            order: {
                id: result.insertId,
                artwork_title: artwork.title,
                amount: artwork.price,
                status: 'pending'
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// ========== CONFIRMER UNE COMMANDE (artiste) ==========
exports.confirmOrder = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    try {
        const [orders] = await db.query(
            `SELECT o.*, a.user_id as seller_id, a.id as artwork_id
             FROM orders o
             JOIN artworks a ON o.artwork_id = a.id
             WHERE o.id = ?`,
            [orderId]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        
        const order = orders[0];
        
        if (order.seller_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorisé' });
        }
        
        if (order.status !== 'pending') {
            return res.status(400).json({ error: 'Cette commande ne peut plus être confirmée' });
        }
        
        await db.query('UPDATE orders SET status = "confirmed" WHERE id = ?', [orderId]);
        await db.query('UPDATE artworks SET is_sold = TRUE WHERE id = ?', [order.artwork_id]);
        
        // 🔔 Notification à l'acheteur
        await notificationController.createNotification(
            order.buyer_id,
            'order_confirmed',
            `Votre commande pour "${order.artwork_title}" a été confirmée par l'artiste. Vous pouvez télécharger votre certificat.`,
            order.artwork_id
        );
        
        res.json({ message: 'Commande confirmée' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// ========== REFUSER UNE COMMANDE (artiste) ==========
exports.refuseOrder = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    try {
        const [orders] = await db.query(
            `SELECT o.*, a.user_id as seller_id, a.title as artwork_title
             FROM orders o
             JOIN artworks a ON o.artwork_id = a.id
             WHERE o.id = ?`,
            [orderId]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        
        const order = orders[0];
        
        if (order.seller_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorisé' });
        }
        
        if (order.status !== 'pending') {
            return res.status(400).json({ error: 'Cette commande ne peut plus être refusée' });
        }
        
        await db.query('UPDATE orders SET status = "refused" WHERE id = ?', [orderId]);
        
        // 🔔 Notification à l'acheteur
        await notificationController.createNotification(
            order.buyer_id,
            'order_refused',
            `L'artiste a refusé votre commande pour "${order.artwork_title}".`,
            order.artwork_id
        );
        
        res.json({ message: 'Commande refusée' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// ========== ANNULER UNE COMMANDE (acheteur) ==========
exports.cancelOrder = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    try {
        const [orders] = await db.query(
            `SELECT o.*, a.user_id as seller_id, a.title as artwork_title
             FROM orders o
             JOIN artworks a ON o.artwork_id = a.id
             WHERE o.id = ?`,
            [orderId]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        
        const order = orders[0];
        
        if (order.buyer_id !== userId && order.seller_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorisé' });
        }
        
        if (order.status === 'confirmed') {
            return res.status(400).json({ error: 'Une commande confirmée ne peut pas être annulée' });
        }
        
        if (order.status === 'refused') {
            return res.status(400).json({ error: 'Une commande refusée ne peut pas être annulée' });
        }
        
        await db.query('UPDATE orders SET status = "cancelled" WHERE id = ?', [orderId]);
        
        // 🔔 Notification à l'artiste
        await notificationController.createNotification(
            order.seller_id,
            'order_cancelled',
            `${req.user.nom} a annulé sa commande pour "${order.artwork_title}".`,
            order.artwork_id
        );
        
        res.json({ message: 'Commande annulée' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};