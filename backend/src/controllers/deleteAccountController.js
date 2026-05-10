const db = require('../config/db');
const fs = require('fs');

// DEMANDER LA SUPPRESSION DU COMPTE
exports.requestDeleteAccount = async (req, res) => {
    const userId = req.user.id;
    
    try {
        // Vérifier si une demande existe déjà
        const [existing] = await db.query(
            'SELECT delete_requested_at FROM users WHERE id = ?',
            [userId]
        );
        
        if (existing[0]?.delete_requested_at) {
            return res.status(400).json({ 
                error: 'Une demande de suppression est déjà en cours. Vous pouvez l\'annuler dans les 72 heures.' 
            });
        }
        
        // Enregistrer la demande
        await db.query(
            'UPDATE users SET delete_requested_at = NOW() WHERE id = ?',
            [userId]
        );
        
        res.json({ 
            message: 'Votre demande de suppression a été enregistrée. Vous avez 72 heures pour annuler cette demande.',
            expires_in: '72 heures'
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la demande de suppression' });
    }
};

// ANNULER LA DEMANDE DE SUPPRESSION
exports.cancelDeleteRequest = async (req, res) => {
    const userId = req.user.id;
    
    try {
        await db.query(
            'UPDATE users SET delete_requested_at = NULL WHERE id = ?',
            [userId]
        );
        
        res.json({ message: 'La suppression de votre compte a été annulée.' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'annulation' });
    }
};

// OBTENIR LE STATUT DE LA DEMANDE
exports.getDeleteStatus = async (req, res) => {
    const userId = req.user.id;
    
    try {
        const [result] = await db.query(
            'SELECT delete_requested_at FROM users WHERE id = ?',
            [userId]
        );
        
        res.json(result[0] || { delete_requested_at: null });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération du statut' });
    }
};

// SUPPRESSION IMMÉDIATE DU COMPTE
exports.deleteAccount = async (req, res) => {
    const userId = req.user.id;
    
    try {
        // Récupérer toutes les œuvres de l'utilisateur
        const [artworks] = await db.query(
            'SELECT image_url, watermark_url FROM artworks WHERE user_id = ?',
            [userId]
        );
        
        // Supprimer les fichiers images des œuvres
        for (const artwork of artworks) {
            if (artwork.image_url && fs.existsSync(artwork.image_url)) {
                fs.unlinkSync(artwork.image_url);
            }
            if (artwork.watermark_url && fs.existsSync(artwork.watermark_url)) {
                fs.unlinkSync(artwork.watermark_url);
            }
        }
        
        // Supprimer l'avatar s'il existe
        const [userInfo] = await db.query('SELECT avatar_url FROM users WHERE id = ?', [userId]);
        if (userInfo[0]?.avatar_url && fs.existsSync(userInfo[0].avatar_url)) {
            fs.unlinkSync(userInfo[0].avatar_url);
        }
        
        // Supprimer l'utilisateur (les autres tables seront supprimées en cascade)
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        
        res.json({ 
            message: 'Votre compte a été supprimé définitivement.',
            redirect: '/'
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
    }
};
