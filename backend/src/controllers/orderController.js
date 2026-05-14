const db = require('../config/db');
const notificationController = require('./notificationController');

// ========== MES COMMANDES (acheteur) avec pagination ==========
exports.getMyOrders = async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    console.log(`📦 getMyOrders - Utilisateur: ${userId}, Page: ${page}, Limite: ${limit}`);

    try {
        // Récupérer les commandes paginées
        const [orders] = await db.query(
            `SELECT o.*, a.title as artwork_title, a.image_url 
             FROM orders o
             JOIN artworks a ON o.artwork_id = a.id
             WHERE o.buyer_id = ?
             ORDER BY o.order_date DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        // Compter le nombre total de commandes
        const [[{ total }]] = await db.query(
            'SELECT COUNT(*) as total FROM orders WHERE buyer_id = ?',
            [userId]
        );
        
        const totalPages = Math.ceil(total / limit);
        
        console.log(`📊 ${orders.length} commande(s) récupérée(s) sur ${total} totale(s)`);

        res.json({
            data: orders,
            pagination: {
                page,
                limit,
                total,
                pages: totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('❌ Erreur getMyOrders:', error);
        res.status(500).json({ error: error.message });
    }
};

// ========== MES VENTES (artiste) avec pagination ==========
exports.getMySales = async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    console.log(`💰 getMySales - Artiste: ${userId}, Page: ${page}, Limite: ${limit}`);

    try {
        // Récupérer les ventes paginées
        const [sales] = await db.query(
            `SELECT o.*, a.title as artwork_title, a.image_url, u.nom as buyer_name
             FROM orders o
             JOIN artworks a ON o.artwork_id = a.id
             JOIN users u ON o.buyer_id = u.id
             WHERE a.user_id = ?
             ORDER BY o.order_date DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        // Compter le nombre total de ventes
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) as total 
             FROM orders o
             JOIN artworks a ON o.artwork_id = a.id
             WHERE a.user_id = ?`,
            [userId]
        );
        
        const totalPages = Math.ceil(total / limit);
        
        console.log(`📊 ${sales.length} vente(s) récupérée(s) sur ${total} totale(s)`);

        res.json({
            data: sales,
            pagination: {
                page,
                limit,
                total,
                pages: totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('❌ Erreur getMySales:', error);
        res.status(500).json({ error: error.message });
    }
};

// ========== CRÉER UNE COMMANDE ==========
exports.createOrder = async (req, res) => {
    const { artworkId } = req.params;
    const buyerId = req.user.id;
    const buyerName = req.user.nom || "Un acheteur";
    
    console.log(`🛒 createOrder - Acheteur: ${buyerId}, Œuvre: ${artworkId}`);
    
    try {
        // Vérifier que l'œuvre existe, est disponible et non vendue
        const [artworks] = await db.query(
            `SELECT a.*, u.id as seller_id 
             FROM artworks a
             JOIN users u ON a.user_id = u.id
             WHERE a.id = ? AND a.is_sold = FALSE AND a.is_available = TRUE`,
            [artworkId]
        );
        
        if (artworks.length === 0) {
            console.log('❌ Œuvre non disponible');
            return res.status(404).json({ error: 'Œuvre non trouvée, indisponible ou déjà vendue' });
        }
        
        const artwork = artworks[0];
        
        // Vérifier que l'acheteur n'est pas le vendeur
        if (artwork.seller_id === buyerId) {
            console.log('❌ Tentative d\'achat de sa propre œuvre');
            return res.status(400).json({ error: 'Vous ne pouvez pas acheter votre propre œuvre' });
        }
        
        // Créer la commande
        const [result] = await db.query(
            `INSERT INTO orders (buyer_id, artwork_id, amount, status) 
             VALUES (?, ?, ?, 'pending')`,
            [buyerId, artworkId, artwork.price]
        );
        
        console.log(`✅ Commande créée - ID: ${result.insertId}`);
        
        // Notifier l'artiste
        await notificationController.createNotification(
            artwork.seller_id,
            'order',
            `${buyerName} souhaite acheter votre œuvre "${artwork.title}"`,
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
        console.error('❌ Erreur createOrder:', error);
        res.status(500).json({ error: error.message });
    }
};

// ========== CONFIRMER UNE COMMANDE (artiste) ==========
exports.confirmOrder = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    console.log(`✅ confirmOrder - Utilisateur: ${userId}, Commande: ${orderId}`);
    
    try {
        // Récupérer les détails de la commande
        const [orders] = await db.query(
            `SELECT o.*, a.user_id as seller_id, a.id as artwork_id, a.title as artwork_title
             FROM orders o
             JOIN artworks a ON o.artwork_id = a.id
             WHERE o.id = ?`,
            [orderId]
        );
        
        if (orders.length === 0) {
            console.log('❌ Commande non trouvée');
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        
        const order = orders[0];
        
        // Vérifier les autorisations
        if (order.seller_id !== userId && req.user.role !== 'admin') {
            console.log('❌ Non autorisé');
            return res.status(403).json({ error: 'Non autorisé' });
        }
        
        // Vérifier le statut
        if (order.status !== 'pending') {
            console.log(`❌ Statut invalide: ${order.status}`);
            return res.status(400).json({ error: 'Cette commande ne peut plus être confirmée' });
        }
        
        // Mettre à jour la commande et l'œuvre
        await db.query('UPDATE orders SET status = "confirmed" WHERE id = ?', [orderId]);
        await db.query('UPDATE artworks SET is_sold = TRUE WHERE id = ?', [order.artwork_id]);
        
        console.log(`✅ Commande ${orderId} confirmée, œuvre ${order.artwork_id} marquée comme vendue`);
        
        // Notifier l'acheteur
        await notificationController.createNotification(
            order.buyer_id,
            'order_confirmed',
            `Votre commande pour "${order.artwork_title}" a été confirmée par l'artiste. Vous pouvez télécharger votre certificat.`,
            order.artwork_id
        );
        
        res.json({ message: 'Commande confirmée' });
        
    } catch (error) {
        console.error('❌ Erreur confirmOrder:', error);
        res.status(500).json({ error: error.message });
    }
};

// ========== REFUSER UNE COMMANDE (artiste) ==========
exports.refuseOrder = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    console.log(`❌ refuseOrder - Utilisateur: ${userId}, Commande: ${orderId}`);
    
    try {
        // Récupérer les détails de la commande
        const [orders] = await db.query(
            `SELECT o.*, a.user_id as seller_id, a.title as artwork_title, a.id as artwork_id
             FROM orders o
             JOIN artworks a ON o.artwork_id = a.id
             WHERE o.id = ?`,
            [orderId]
        );
        
        if (orders.length === 0) {
            console.log('❌ Commande non trouvée');
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        
        const order = orders[0];
        
        // Vérifier les autorisations
        if (order.seller_id !== userId && req.user.role !== 'admin') {
            console.log('❌ Non autorisé');
            return res.status(403).json({ error: 'Non autorisé' });
        }
        
        // Vérifier le statut
        if (order.status !== 'pending') {
            console.log(`❌ Statut invalide: ${order.status}`);
            return res.status(400).json({ error: 'Cette commande ne peut plus être refusée' });
        }
        
        // Refuser la commande
        await db.query('UPDATE orders SET status = "refused" WHERE id = ?', [orderId]);
        
        console.log(`✅ Commande ${orderId} refusée`);
        
        // Notifier l'acheteur
        await notificationController.createNotification(
            order.buyer_id,
            'order_refused',
            `L'artiste a refusé votre commande pour "${order.artwork_title}".`,
            order.artwork_id
        );
        
        res.json({ message: 'Commande refusée' });
        
    } catch (error) {
        console.error('❌ Erreur refuseOrder:', error);
        res.status(500).json({ error: error.message });
    }
};

// ========== ANNULER UNE COMMANDE (acheteur) ==========
exports.cancelOrder = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    console.log(`🚫 cancelOrder - Utilisateur: ${userId}, Commande: ${orderId}`);
    
    try {
        // Récupérer les détails de la commande
        const [orders] = await db.query(
            `SELECT o.*, a.user_id as seller_id, a.title as artwork_title, a.id as artwork_id
             FROM orders o
             JOIN artworks a ON o.artwork_id = a.id
             WHERE o.id = ?`,
            [orderId]
        );
        
        if (orders.length === 0) {
            console.log('❌ Commande non trouvée');
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        
        const order = orders[0];
        
        // Vérifier les autorisations (acheteur, vendeur ou admin)
        if (order.buyer_id !== userId && order.seller_id !== userId && req.user.role !== 'admin') {
            console.log('❌ Non autorisé');
            return res.status(403).json({ error: 'Non autorisé' });
        }
        
        // Vérifier le statut
        if (order.status === 'confirmed') {
            console.log('❌ Impossible d\'annuler une commande confirmée');
            return res.status(400).json({ error: 'Une commande confirmée ne peut pas être annulée' });
        }
        
        if (order.status === 'refused') {
            console.log('❌ Impossible d\'annuler une commande refusée');
            return res.status(400).json({ error: 'Une commande refusée ne peut pas être annulée' });
        }
        
        // Annuler la commande
        await db.query('UPDATE orders SET status = "cancelled" WHERE id = ?', [orderId]);
        
        console.log(`✅ Commande ${orderId} annulée`);
        
        // Notifier le vendeur
        await notificationController.createNotification(
            order.seller_id,
            'order_cancelled',
            `${req.user.nom} a annulé sa commande pour "${order.artwork_title}".`,
            order.artwork_id
        );
        
        res.json({ message: 'Commande annulée' });
        
    } catch (error) {
        console.error('❌ Erreur cancelOrder:', error);
        res.status(500).json({ error: error.message });
    }
};