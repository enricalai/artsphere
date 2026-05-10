const db = require('../config/db');
const notificationController = require('./notificationController');

// AJOUTER UN COMMENTAIRE
exports.addComment = async (req, res) => {
    const { artworkId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user.id;
    
    if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Le commentaire ne peut pas être vide' });
    }
    
    try {
        // Récupérer le nom de l'utilisateur depuis la BDD
        const [userInfo] = await db.query('SELECT nom FROM users WHERE id = ?', [userId]);
        const userName = userInfo[0]?.nom || 'Un utilisateur';
        
        // Vérifier si l'œuvre existe
        const [artwork] = await db.query(
            `SELECT a.id, a.user_id as artist_id, a.title 
             FROM artworks a 
             WHERE a.id = ?`,
            [artworkId]
        );
        
        if (artwork.length === 0) {
            return res.status(404).json({ error: 'Œuvre non trouvée' });
        }
        
        const artworkData = artwork[0];
        
        // Ajouter le commentaire
        const [result] = await db.query(
            'INSERT INTO comments (user_id, artwork_id, content, parent_id) VALUES (?, ?, ?, ?)',
            [userId, artworkId, content, parentId || null]
        );
        
        // NOTIFICATION pour nouveau commentaire (pas une réponse)
        if (!parentId && userId !== artworkData.artist_id) {
            const message = `${userName} a commenté votre œuvre "${artworkData.title}" : "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`;
            await notificationController.createNotification(
                artworkData.artist_id,
                'comment',
                message,
                artworkId
            );
        }
        
        // NOTIFICATION pour une réponse
        if (parentId) {
            const [parentComment] = await db.query(
                'SELECT user_id FROM comments WHERE id = ?',
                [parentId]
            );
            if (parentComment.length > 0 && parentComment[0].user_id !== userId) {
                const message = `${userName} a répondu à votre commentaire : "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`;
                await notificationController.createNotification(
                    parentComment[0].user_id,
                    'reply',
                    message,
                    artworkId
                );
            }
        }
        
        const [newComment] = await db.query(
            `SELECT c.*, u.nom as user_name 
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = ?`,
            [result.insertId]
        );
        
        res.status(201).json({
            message: 'Commentaire ajouté',
            comment: newComment[0]
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout du commentaire' });
    }
};

// ... le reste du fichier (getCommentsByArtwork, deleteComment) reste identique

// RÉCUPÉRER LES COMMENTAIRES (avec réponses)
exports.getCommentsByArtwork = async (req, res) => {
    const { artworkId } = req.params;
    
    try {
        const [comments] = await db.query(
            `SELECT c.*, u.nom as user_name, u.id as user_id
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.artwork_id = ?
             ORDER BY c.created_at ASC`,
            [artworkId]
        );
        
        // Organiser les commentaires en arborescence
        const commentsMap = {};
        const roots = [];
        
        comments.forEach(comment => {
            comment.replies = [];
            commentsMap[comment.id] = comment;
        });
        
        comments.forEach(comment => {
            if (comment.parent_id) {
                if (commentsMap[comment.parent_id]) {
                    commentsMap[comment.parent_id].replies.push(comment);
                }
            } else {
                roots.push(comment);
            }
        });
        
        res.json(roots);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération des commentaires' });
    }
};

// SUPPRIMER UN COMMENTAIRE
exports.deleteComment = async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    try {
        const [comment] = await db.query(
            'SELECT user_id FROM comments WHERE id = ?',
            [commentId]
        );
        
        if (comment.length === 0) {
            return res.status(404).json({ error: 'Commentaire non trouvé' });
        }
        
        if (comment[0].user_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'Non autorisé à supprimer ce commentaire' });
        }
        
        await db.query('DELETE FROM comments WHERE id = ?', [commentId]);
        
        res.json({ message: 'Commentaire supprimé' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
};