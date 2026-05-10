const db = require('../config/db');

// Récupérer le profil public d'un utilisateur
exports.getUserProfile = async (req, res) => {
    const { userId } = req.params;
    
    try {
        const [users] = await db.query(
            `SELECT id, nom, sexe, age, ville, pays, bio, avatar_url, created_at 
             FROM users 
             WHERE id = ?`,
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        // Ne pas inclure les informations sensibles (email, password, etc.)
        res.json(users[0]);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
    }
};