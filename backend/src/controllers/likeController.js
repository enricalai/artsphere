const db = require('../config/db');
const notificationController = require('./notificationController');

// AJOUTER UN LIKE (avec notification)
exports.addLike = async (req, res) => {
    const { artworkId } = req.params;
    const userId = req.user.id;
    
    try {
        // Récupérer le nom de l'utilisateur depuis la BDD
        const [userInfo] = await db.query('SELECT nom FROM users WHERE id = ?', [userId]);
        const userName = userInfo[0]?.nom || 'Un utilisateur';
        
        // Vérifier si l'œuvre existe et récupérer l'artiste
        const [artwork] = await db.query(
            'SELECT a.id, a.user_id as artist_id, a.title FROM artworks a WHERE a.id = ?',
            [artworkId]
        );
        
        if (artwork.length === 0) {
            return res.status(404).json({ error: 'Œuvre non trouvée' });
        }
        
        const artworkData = artwork[0];
        
        // Vérifier si déjà liké
        const [existing] = await db.query(
            'SELECT * FROM likes WHERE user_id = ? AND artwork_id = ?',
            [userId, artworkId]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Vous avez déjà liké cette œuvre' });
        }
        
        // Ajouter le like
        await db.query(
            'INSERT INTO likes (user_id, artwork_id) VALUES (?, ?)',
            [userId, artworkId]
        );
        
        // NOTIFICATION POUR L'ARTISTE
        if (userId !== artworkData.artist_id) {
            const message = `${userName} a aimé votre œuvre "${artworkData.title}"`;
            await notificationController.createNotification(
                artworkData.artist_id,
                'like',
                message,
                artworkId
            );
        }
        
        const [countResult] = await db.query(
            'SELECT COUNT(*) as count FROM likes WHERE artwork_id = ?',
            [artworkId]
        );
        
        res.status(201).json({ 
            message: 'Like ajouté',
            likes_count: countResult[0].count
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout du like' });
    }
};

// SUPPRIMER UN LIKE
exports.removeLike = async (req, res) => {
    const { artworkId } = req.params;
    const userId = req.user.id;
    
    try {
        const [result] = await db.query(
            'DELETE FROM likes WHERE user_id = ? AND artwork_id = ?',
            [userId, artworkId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Like non trouvé' });
        }
        
        const [countResult] = await db.query(
            'SELECT COUNT(*) as count FROM likes WHERE artwork_id = ?',
            [artworkId]
        );
        
        res.json({ 
            message: 'Like supprimé',
            likes_count: countResult[0].count
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la suppression du like' });
    }
};

// VÉRIFIER SI L'UTILISATEUR A LIKÉ
exports.checkLike = async (req, res) => {
    const { artworkId } = req.params;
    const userId = req.user.id;
    
    try {
        const [result] = await db.query(
            'SELECT * FROM likes WHERE user_id = ? AND artwork_id = ?',
            [userId, artworkId]
        );
        
        res.json({ liked: result.length > 0 });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la vérification' });
    }
};