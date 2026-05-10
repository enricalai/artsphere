const db = require('../config/db');
const fs = require('fs').promises; // Utilisation des promesses pour les fichiers
const bcrypt = require('bcrypt');

// =============================================
// STATISTIQUES DU TABLEAU DE BORD
// =============================================

exports.getDashboardStats = async (req, res) => {
    try {
        // Exécution des compteurs simples en parallèle pour gagner du temps
        const [
            [totalArtworks],
            [totalUsers],
            [totalOrders],
            [totalRevenue]
        ] = await Promise.all([
            db.query('SELECT COUNT(*) as count FROM artworks WHERE status = "active"'),
            db.query('SELECT COUNT(*) as count FROM users WHERE role = "user"'),
            db.query('SELECT COUNT(*) as count FROM orders'),
            db.query('SELECT SUM(amount) as total FROM orders WHERE status = "confirmed"')
        ]);

        const [topArtworks] = await db.query(
            `SELECT a.id, a.title, a.image_url, u.nom as artist_name, COUNT(l.artwork_id) as likes_count
             FROM artworks a
             JOIN users u ON a.user_id = u.id
             LEFT JOIN likes l ON a.id = l.artwork_id
             WHERE a.status = 'active'
             GROUP BY a.id
             ORDER BY likes_count DESC
             LIMIT 3`
        );

        const [topUsers] = await db.query(
            `SELECT u.id, u.nom, u.email, COUNT(a.id) as artworks_count
             FROM users u
             LEFT JOIN artworks a ON u.id = a.user_id
             WHERE u.role = 'user'
             GROUP BY u.id
             ORDER BY artworks_count DESC
             LIMIT 3`
        );

        res.json({
            stats: {
                total_artworks: totalArtworks[0].count,
                total_users: totalUsers[0].count,
                total_orders: totalOrders[0].count,
                total_revenue: totalRevenue[0].total || 0
            },
            top_artworks: topArtworks,
            top_users: topUsers
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
};

// =============================================
// GESTION DES UTILISATEURS
// =============================================

exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, email, nom, sexe, age, ville, pays, avatar_url, role, is_suspended, created_at,
             (SELECT COUNT(*) FROM artworks WHERE user_id = users.id) as artworks_count
             FROM users
             ORDER BY created_at DESC`
        );
        
        res.json(users);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
};

exports.suspendUser = async (req, res) => {
    const { userId } = req.params;
    try {
        const [users] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);

        if (users.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        if (users[0].role === 'admin') return res.status(403).json({ error: 'Impossible de suspendre un admin' });

        await db.query('UPDATE users SET is_suspended = TRUE WHERE id = ?', [userId]);
        await db.query('UPDATE artworks SET status = "suspended" WHERE user_id = ?', [userId]);

        res.json({ message: 'Utilisateur et ses œuvres suspendus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la suspension' });
    }
};

exports.unsuspendUser = async (req, res) => {
    const { userId } = req.params;
    try {
        await db.query('UPDATE users SET is_suspended = FALSE WHERE id = ?', [userId]);
        await db.query('UPDATE artworks SET status = "active" WHERE user_id = ? AND status = "suspended"', [userId]);
        res.json({ message: 'Utilisateur réactivé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la réactivation' });
    }
};

// =============================================
// GESTION DES ADMINISTRATEURS
// =============================================

exports.createAdmin = async (req, res) => {
    const { email, password, nom } = req.body;
    if (!email || !password || !nom) return res.status(400).json({ error: 'Tous les champs sont requis' });

    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'Email déjà utilisé' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (email, password, nom, role) VALUES (?, ?, ?, "admin")',
            [email, hashedPassword, nom]
        );

        res.status(201).json({ message: 'Admin créé', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la création' });
    }
};

// =============================================
// GESTION DES SIGNALEMENTS
// =============================================

exports.createReport = async (req, res) => {
    const { targetUserId, targetArtworkId, reason } = req.body;
    const reporterId = req.user.id;

    if (!targetUserId && !targetArtworkId) return res.status(400).json({ error: 'Cible manquante' });
    if (!reason) return res.status(400).json({ error: 'Raison requise' });

    try {
        if (targetUserId && parseInt(targetUserId) === reporterId) {
            return res.status(400).json({ error: 'Auto-signalement impossible' });
        }

        const [result] = await db.query(
            'INSERT INTO reports (reporter_id, target_user_id, target_artwork_id, reason, status) VALUES (?, ?, ?, ?, "pending")',
            [reporterId, targetUserId || null, targetArtworkId || null, reason]
        );

        res.status(201).json({ message: 'Signalement envoyé', report_id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur signalement' });
    }
};

exports.getAllReports = async (req, res) => {
    const { status } = req.query;
    let sql = `
        SELECT r.*, u_reporter.nom as reporter_name, u_target.nom as target_name, a.title as artwork_title
        FROM reports r
        JOIN users u_reporter ON r.reporter_id = u_reporter.id
        LEFT JOIN users u_target ON r.target_user_id = u_target.id
        LEFT JOIN artworks a ON r.target_artwork_id = a.id
    `;
    const params = [];
    if (status) {
        sql += ' WHERE r.status = ?';
        params.push(status);
    }
    sql += ' ORDER BY r.created_at DESC';

    try {
        const [reports] = await db.query(sql, params);
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: 'Erreur récupération signalements' });
    }
};

exports.resolveReport = async (req, res) => {
    const { reportId } = req.params;
    const { action } = req.body; // 'dismiss' ou 'suspend'

    try {
        const [reports] = await db.query('SELECT * FROM reports WHERE id = ?', [reportId]);
        if (reports.length === 0) return res.status(404).json({ error: 'Signalement non trouvé' });

        const report = reports[0];

        if (action === 'suspend') {
            if (report.target_user_id) {
                await db.query('UPDATE users SET is_suspended = TRUE WHERE id = ?', [report.target_user_id]);
                await db.query('UPDATE artworks SET status = "suspended" WHERE user_id = ?', [report.target_user_id]);
            }
            if (report.target_artwork_id) {
                await db.query('UPDATE artworks SET status = "reported" WHERE id = ?', [report.target_artwork_id]);
            }
        }

        await db.query('UPDATE reports SET status = "resolved" WHERE id = ?', [reportId]);
        res.json({ message: 'Signalement traité' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur traitement' });
    }
};

// =============================================
// GESTION DES ŒUVRES (vue admin)
// =============================================

exports.adminDeleteArtwork = async (req, res) => {
    const { artworkId } = req.params;
    try {
        const [artworks] = await db.query('SELECT image_url, watermark_url FROM artworks WHERE id = ?', [artworkId]);
        if (artworks.length === 0) return res.status(404).json({ error: 'Œuvre non trouvée' });

        const artwork = artworks[0];

        // Suppression des fichiers sur le disque (asynchrone)
        const filesToDelete = [artwork.image_url, artwork.watermark_url].filter(path => path);
        
        for (const path of filesToDelete) {
            try {
                await fs.unlink(path);
            } catch (err) {
                console.warn(`Impossible de supprimer le fichier : ${path}`);
            }
        }

        await db.query('DELETE FROM artworks WHERE id = ?', [artworkId]);
        res.json({ message: 'Œuvre et fichiers supprimés' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
};