const db = require('../config/db');

// MES COMMANDES
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

// MES VENTES
exports.getMySales = async (req, res) => {
    const userId = req.user.id;
    
    try {
        const [sales] = await db.query(
            `SELECT o.*, a.title as artwork_title, a.image_url 
             FROM orders o
             JOIN artworks a ON o.artwork_id = a.id
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

// CRÉER UNE COMMANDE
exports.createOrder = async (req, res) => {
    const { artworkId } = req.params;
    const buyerId = req.user.id;
    
    try {
        const [artworks] = await db.query(
            `SELECT a.*, u.id as seller_id 
             FROM artworks a
             JOIN users u ON a.user_id = u.id
             WHERE a.id = ? AND a.is_sold = FALSE`,
            [artworkId]
        );
        
        if (artworks.length === 0) {
            return res.status(404).json({ error: 'Œuvre non trouvée ou déjà vendue' });
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

// CONFIRMER UNE COMMANDE
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
        
        res.json({ message: 'Commande confirmée' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// ANNULER UNE COMMANDE
exports.cancelOrder = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    try {
        const [orders] = await db.query(
            `SELECT o.*, a.user_id as seller_id
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
        
        await db.query('UPDATE orders SET status = "cancelled" WHERE id = ?', [orderId]);
        
        res.json({ message: 'Commande annulée' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};