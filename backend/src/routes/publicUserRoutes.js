const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// 🔍 Recherche d'autres utilisateurs (réservée aux membres connectés)
router.get('/search', authMiddleware, async (req, res) => {
    const { q } = req.query;
    const currentUserId = req.user.id;

    if (!q || q.trim().length < 2) {
        return res.status(400).json({ error: 'Minimum 2 caractères' });
    }

    try {
        const searchTerm = `%${q.trim()}%`;
        const [rows] = await db.query(
            `SELECT id, nom, email, ville, pays, avatar_url
             FROM users
             WHERE (nom LIKE ? OR email LIKE ? OR ville LIKE ? OR pays LIKE ?)
               AND id != ?
             ORDER BY nom ASC
             LIMIT 30`,
            [searchTerm, searchTerm, searchTerm, searchTerm, currentUserId]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur recherche' });
    }
});

// 👤 Profil public d'un utilisateur avec ses œuvres
router.get('/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params;

    try {
        // Récupération des infos utilisateur
        const [users] = await db.query(
            `SELECT id, nom, email, ville, pays, bio, avatar_url, created_at
             FROM users
             WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Récupération des œuvres de l'utilisateur avec correction des backslashes
        const [artworks] = await db.query(
            `SELECT id, title, REPLACE(image_url, '\\\\', '/') AS image_url, price, category, format, created_at
             FROM artworks
             WHERE user_id = ? AND status = 'active'
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json({
            user: users[0],
            artworks: artworks
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors du chargement du profil public' });
    }
});

module.exports = router;