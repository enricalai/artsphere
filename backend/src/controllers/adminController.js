const db = require('../config/db');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');

// =============================================
// STATISTIQUES DU TABLEAU DE BORD
// =============================================

exports.getDashboardStats = async (req, res) => {
    try {
        // Utiliser db.query correctement (promise)
        const [totalArtworks] = await db.query('SELECT COUNT(*) as count FROM artworks WHERE status = "active"');
        const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
        const [totalOrders] = await db.query('SELECT COUNT(*) as count FROM orders');
        const [totalRevenue] = await db.query('SELECT SUM(amount) as total FROM orders WHERE status = "confirmed"');

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
                total_artworks: totalArtworks[0]?.count || 0,
                total_users: totalUsers[0]?.count || 0,
                total_orders: totalOrders[0]?.count || 0,
                total_revenue: totalRevenue[0]?.total || 0
            },
            top_artworks: topArtworks || [],
            top_users: topUsers || []
        });

    } catch (error) {
        console.error('Erreur getDashboardStats:', error);
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
        console.error('Erreur getAllUsers:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
};

exports.getUserById = async (req, res) => {
    const { userId } = req.params;
    try {
        const [users] = await db.query(
            `SELECT id, email, nom, sexe, age, ville, pays, avatar_url, role, is_suspended, created_at,
             (SELECT COUNT(*) FROM artworks WHERE user_id = users.id) as artworks_count
             FROM users
             WHERE id = ?`,
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        res.json(users[0]);
        
    } catch (error) {
        console.error('Erreur getUserById:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
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
        console.error('Erreur suspendUser:', error);
        res.status(500).json({ error: 'Erreur lors de la suspension' });
    }
};

exports.unsuspendUser = async (req, res) => {
    const { userId } = req.params;
    try {
        const [users] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        
        await db.query('UPDATE users SET is_suspended = FALSE WHERE id = ?', [userId]);
        await db.query('UPDATE artworks SET status = "active" WHERE user_id = ? AND status = "suspended"', [userId]);
        
        res.json({ message: 'Utilisateur réactivé avec succès' });
    } catch (error) {
        console.error('Erreur unsuspendUser:', error);
        res.status(500).json({ error: 'Erreur lors de la réactivation' });
    }
};

exports.deleteUser = async (req, res) => {
    const { userId } = req.params;
    try {
        const [users] = await db.query('SELECT role, avatar_url FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        if (users[0].role === 'admin') return res.status(403).json({ error: 'Impossible de supprimer un admin' });
        
        // Supprimer l'avatar si existant
        if (users[0].avatar_url) {
            try {
                await fs.unlink(users[0].avatar_url);
            } catch (err) {
                console.warn(`Impossible de supprimer l'avatar : ${users[0].avatar_url}`);
            }
        }
        
        // Supprimer toutes les œuvres de l'utilisateur
        const [artworks] = await db.query('SELECT image_url, watermark_url FROM artworks WHERE user_id = ?', [userId]);
        for (const artwork of artworks) {
            const filesToDelete = [artwork.image_url, artwork.watermark_url].filter(path => path);
            for (const path of filesToDelete) {
                try {
                    await fs.unlink(path);
                } catch (err) {
                    console.warn(`Impossible de supprimer le fichier : ${path}`);
                }
            }
        }
        
        // Supprimer l'utilisateur (les œuvres seront supprimées par CASCADE)
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        
        res.json({ message: 'Utilisateur et toutes ses données supprimés' });
    } catch (error) {
        console.error('Erreur deleteUser:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
    }
};

// =============================================
// GESTION DES ADMINISTRATEURS
// =============================================

exports.createAdmin = async (req, res) => {
    const { email, password, nom } = req.body;
    if (!email || !password || !nom) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email déjà utilisé' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (email, password, nom, role) VALUES (?, ?, ?, "admin")',
            [email, hashedPassword, nom]
        );

        res.status(201).json({ 
            message: 'Administrateur créé avec succès', 
            id: result.insertId 
        });
    } catch (error) {
        console.error('Erreur createAdmin:', error);
        res.status(500).json({ error: 'Erreur lors de la création de l\'administrateur' });
    }
};

exports.getAllAdmins = async (req, res) => {
    try {
        const [admins] = await db.query(
            `SELECT id, email, nom, created_at 
             FROM users 
             WHERE role = 'admin' 
             ORDER BY created_at DESC`
        );
        res.json(admins);
    } catch (error) {
        console.error('Erreur getAllAdmins:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des administrateurs' });
    }
};

exports.deleteAdmin = async (req, res) => {
    const { adminId } = req.params;
    try {
        const [admins] = await db.query('SELECT role FROM users WHERE id = ?', [adminId]);
        
        if (admins.length === 0) {
            return res.status(404).json({ error: 'Administrateur non trouvé' });
        }
        if (admins[0].role !== 'admin') {
            return res.status(400).json({ error: 'Cet utilisateur n\'est pas un administrateur' });
        }
        
        // Vérifier qu'il reste au moins un admin
        const [adminCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
        if (adminCount[0].count <= 1) {
            return res.status(400).json({ error: 'Impossible de supprimer le dernier administrateur' });
        }
        
        await db.query('DELETE FROM users WHERE id = ?', [adminId]);
        res.json({ message: 'Administrateur supprimé avec succès' });
    } catch (error) {
        console.error('Erreur deleteAdmin:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'administrateur' });
    }
};

// =============================================
// GESTION DES SIGNALEMENTS
// =============================================

exports.createReport = async (req, res) => {
    const { targetUserId, targetArtworkId, reason } = req.body;
    const reporterId = req.user.id;

    if (!targetUserId && !targetArtworkId) {
        return res.status(400).json({ error: 'Veuillez spécifier une cible (utilisateur ou œuvre)' });
    }
    if (!reason) {
        return res.status(400).json({ error: 'La raison du signalement est requise' });
    }

    try {
        if (targetUserId && parseInt(targetUserId) === reporterId) {
            return res.status(400).json({ error: 'Vous ne pouvez pas vous signaler vous-même' });
        }

        // Vérifier si un signalement en attente existe déjà
        let existingReport;
        if (targetUserId) {
            [existingReport] = await db.query(
                'SELECT id FROM reports WHERE reporter_id = ? AND target_user_id = ? AND status = "pending"',
                [reporterId, targetUserId]
            );
        } else {
            [existingReport] = await db.query(
                'SELECT id FROM reports WHERE reporter_id = ? AND target_artwork_id = ? AND status = "pending"',
                [reporterId, targetArtworkId]
            );
        }
        
        if (existingReport.length > 0) {
            return res.status(400).json({ error: 'Vous avez déjà signalé cette cible' });
        }

        await db.query(
            'INSERT INTO reports (reporter_id, target_user_id, target_artwork_id, reason, status) VALUES (?, ?, ?, ?, "pending")',
            [reporterId, targetUserId || null, targetArtworkId || null, reason]
        );

        // 🔍 Vérifier suspension auto si c'est un signalement utilisateur
        if (targetUserId) {
            await exports.checkAndAutoSuspend(targetUserId);
        }

        res.status(201).json({ 
            message: 'Signalement envoyé avec succès'
        });
    } catch (error) {
        console.error('Erreur createReport:', error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi du signalement' });
    }
};

exports.getAllReports = async (req, res) => {
    const { status } = req.query;
    let sql = `
        SELECT r.*, 
               r.created_at as report_date,
               u_reporter.id as reporter_id,
               u_reporter.nom as reporter_name, 
               u_reporter.email as reporter_email,
               u_target.id as target_id,
               u_target.nom as target_name, 
               u_target.email as target_email,
               a.id as artwork_id,
               a.title as artwork_title, 
               a.image_url as artwork_image
        FROM reports r
        JOIN users u_reporter ON r.reporter_id = u_reporter.id
        LEFT JOIN users u_target ON r.target_user_id = u_target.id
        LEFT JOIN artworks a ON r.target_artwork_id = a.id
    `;
    const params = [];
    
    if (status && ['pending', 'resolved'].includes(status)) {
        sql += ' WHERE r.status = ?';
        params.push(status);
    }
    sql += ' ORDER BY r.created_at DESC';

    try {
        const [reports] = await db.query(sql, params);
        res.json(reports);
    } catch (error) {
        console.error('Erreur getAllReports:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des signalements' });
    }
};

exports.getReportById = async (req, res) => {
    const { reportId } = req.params;
    try {
        const [reports] = await db.query(
            `SELECT r.*, 
                    u_reporter.nom as reporter_name, u_reporter.email as reporter_email,
                    u_target.nom as target_name, u_target.email as target_email,
                    a.title as artwork_title, a.id as artwork_id
             FROM reports r
             JOIN users u_reporter ON r.reporter_id = u_reporter.id
             LEFT JOIN users u_target ON r.target_user_id = u_target.id
             LEFT JOIN artworks a ON r.target_artwork_id = a.id
             WHERE r.id = ?`,
            [reportId]
        );
        
        if (reports.length === 0) {
            return res.status(404).json({ error: 'Signalement non trouvé' });
        }
        
        res.json(reports[0]);
    } catch (error) {
        console.error('Erreur getReportById:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du signalement' });
    }
};

exports.resolveReport = async (req, res) => {
    const { reportId } = req.params;
    const { action } = req.body;

    if (!action || !['ignore', 'suspend'].includes(action)) {
        return res.status(400).json({ error: 'Action requise: "ignore" ou "suspend"' });
    }

    try {
        const [reports] = await db.query(
            `SELECT * FROM reports WHERE id = ? AND status = "pending"`,
            [reportId]
        );

        if (reports.length === 0) {
            return res.status(404).json({ error: 'Signalement non trouvé ou déjà traité' });
        }

        const report = reports[0];

        if (action === 'suspend') {
            if (report.target_user_id) {
                await db.query('UPDATE users SET is_suspended = TRUE WHERE id = ?', [report.target_user_id]);
                await db.query('UPDATE artworks SET status = "suspended" WHERE user_id = ?', [report.target_user_id]);
            }
            if (report.target_artwork_id) {
                await db.query('UPDATE artworks SET status = "suspended" WHERE id = ?', [report.target_artwork_id]);
            }
        }

        await db.query('UPDATE reports SET status = "resolved" WHERE id = ?', [reportId]);

        res.json({ 
            message: action === 'suspend' ? 'Signalement traité : contenu suspendu' : 'Signalement ignoré'
        });
    } catch (error) {
        console.error('Erreur resolveReport:', error);
        res.status(500).json({ error: 'Erreur lors du traitement du signalement' });
    }
};

// Vérifier et suspendre automatiquement un utilisateur après 3 signalements
// =============================================
// VÉRIFICATION ET SUSPENSION AUTOMATIQUE
// =============================================

exports.checkAndAutoSuspend = async (userId) => {
    try {
        // Vérifier si l'utilisateur existe et n'est pas déjà admin
        const [userCheck] = await db.query(
            'SELECT id, email, nom, role, is_suspended FROM users WHERE id = ?', 
            [userId]
        );
        
        if (userCheck.length === 0) {
            console.log(`❌ Utilisateur ${userId} inexistant`);
            return false;
        }
        
        const user = userCheck[0];
        
        // Ne pas suspendre les admins
        if (user.role === 'admin') {
            console.log(`⛔ Tentative de suspension d'un admin (${user.email}) - Ignoré`);
            return false;
        }
        
        // Vérifier si déjà suspendu
        if (user.is_suspended) {
            console.log(`ℹ️ Utilisateur ${userId} (${user.email}) déjà suspendu`);
            return false;
        }
        
        // Compter UNIQUEMENT les signalements PENDING (non résolus)
        const [reports] = await db.query(
            `SELECT COUNT(*) as count 
             FROM reports 
             WHERE target_user_id = ? 
               AND status = 'pending'`,
            [userId]
        );
        
        const pendingReports = reports[0]?.count || 0;
        console.log(`🔍 Utilisateur ${userId} (${user.email}) : ${pendingReports} signalement(s) en attente`);
        
        // SEUIL STRICT : 3 signalements = suspension automatique
        if (pendingReports >= 3) {
            // Démarrer une transaction pour garantir l'intégrité
            const connection = await db.getConnection();
            await connection.beginTransaction();
            
            try {
                // 1. Suspendre l'utilisateur
                await connection.query(
                    'UPDATE users SET is_suspended = TRUE WHERE id = ?', 
                    [userId]
                );
                
                // 2. Suspendre TOUTES ses œuvres
                await connection.query(
                    'UPDATE artworks SET status = "suspended" WHERE user_id = ?', 
                    [userId]
                );
                
                // 3. Résoudre TOUS ses signalements en attente
                await connection.query(
                    `UPDATE reports 
                     SET status = 'resolved' 
                     WHERE target_user_id = ? 
                       AND status = 'pending'`,
                    [userId]
                );
                
                // 4. Optionnel: Ajouter une notification admin (si table notifications existe)
                // await connection.query(
                //     `INSERT INTO notifications (user_id, type, title, message) 
                //      VALUES (?, 'auto_suspend', 'Suspension automatique', ?)`,
                //     [1, `L'utilisateur ${user.email} a été suspendu automatiquement après ${pendingReports} signalements`]
                // );
                
                await connection.commit();
                
                console.log(`🔒 UTILISATEUR SUSPENDU AUTOMATIQUEMENT:`);
                console.log(`   - ID: ${userId}`);
                console.log(`   - Email: ${user.email}`);
                console.log(`   - Nom: ${user.nom}`);
                console.log(`   - Signalements: ${pendingReports}`);
                console.log(`   - Date: ${new Date().toISOString()}`);
                
                return true;
                
            } catch (error) {
                await connection.rollback();
                console.error(`❌ Erreur lors de la suspension automatique de l'utilisateur ${userId}:`, error);
                throw error;
            } finally {
                connection.release();
            }
        } else {
            console.log(`✅ Utilisateur ${userId} (${user.email}) : ${pendingReports}/3 signalements - Pas de suspension`);
            
            // Optionnel: Alerter si proche du seuil
            if (pendingReports === 2) {
                console.log(`⚠️ ALERTE: Utilisateur ${userId} (${user.email}) a ${pendingReports} signalements - Proche du seuil de suspension`);
            }
        }
        
        return false;
        
    } catch (error) {
        console.error(`❌ Erreur critique dans checkAndAutoSuspend pour l'utilisateur ${userId}:`, error);
        return false;
    }
};

// =============================================
// GESTION DES ŒUVRES (vue admin)
// =============================================

exports.getAllArtworks = async (req, res) => {
    const { status } = req.query;
    let sql = `
        SELECT a.*, u.nom as artist_name, u.email as artist_email,
               (SELECT COUNT(*) FROM likes WHERE artwork_id = a.id) as likes_count,
               (SELECT COUNT(*) FROM orders WHERE artwork_id = a.id AND status = "confirmed") as sales_count
        FROM artworks a
        JOIN users u ON a.user_id = u.id
    `;
    const params = [];
    
    if (status && ['active', 'suspended', 'reported'].includes(status)) {
        sql += ' WHERE a.status = ?';
        params.push(status);
    }
    sql += ' ORDER BY a.created_at DESC';

    try {
        const [artworks] = await db.query(sql, params);
        res.json(artworks);
    } catch (error) {
        console.error('Erreur getAllArtworks:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des œuvres' });
    }
};

exports.getArtworkById = async (req, res) => {
    const { artworkId } = req.params;
    try {
        const [artworks] = await db.query(
            `SELECT a.*, u.nom as artist_name, u.email as artist_email, u.id as artist_id
             FROM artworks a
             JOIN users u ON a.user_id = u.id
             WHERE a.id = ?`,
            [artworkId]
        );
        
        if (artworks.length === 0) {
            return res.status(404).json({ error: 'Œuvre non trouvée' });
        }
        
        res.json(artworks[0]);
    } catch (error) {
        console.error('Erreur getArtworkById:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'œuvre' });
    }
};

exports.adminDeleteArtwork = async (req, res) => {
    const { artworkId } = req.params;
    try {
        const [artworks] = await db.query('SELECT image_url, watermark_url FROM artworks WHERE id = ?', [artworkId]);
        if (artworks.length === 0) {
            return res.status(404).json({ error: 'Œuvre non trouvée' });
        }

        const artwork = artworks[0];

        const filesToDelete = [artwork.image_url, artwork.watermark_url].filter(path => path && path !== '');
        
        for (const path of filesToDelete) {
            try {
                await fs.unlink(path);
                console.log(`Fichier supprimé : ${path}`);
            } catch (err) {
                console.warn(`Impossible de supprimer le fichier : ${path}`, err.message);
            }
        }

        await db.query('DELETE FROM artworks WHERE id = ?', [artworkId]);
        res.json({ message: 'Œuvre et ses fichiers supprimés avec succès' });
    } catch (error) {
        console.error('Erreur adminDeleteArtwork:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'œuvre' });
    }
};

exports.adminUpdateArtworkStatus = async (req, res) => {
    const { artworkId } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'suspended', 'reported'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide' });
    }
    
    try {
        const [artworks] = await db.query('SELECT id FROM artworks WHERE id = ?', [artworkId]);
        if (artworks.length === 0) {
            return res.status(404).json({ error: 'Œuvre non trouvée' });
        }
        
        await db.query('UPDATE artworks SET status = ? WHERE id = ?', [status, artworkId]);
        res.json({ message: `Statut de l'œuvre mis à jour : ${status}` });
    } catch (error) {
        console.error('Erreur adminUpdateArtworkStatus:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
    }
};

// =============================================
// GESTION DES COMMANDES (vue admin)
// =============================================

exports.getAllOrders = async (req, res) => {
    const { status } = req.query;
    let sql = `
        SELECT o.*, 
               u.nom as buyer_name, u.email as buyer_email,
               a.title as artwork_title, a.image_url as artwork_image
        FROM orders o
        JOIN users u ON o.buyer_id = u.id
        JOIN artworks a ON o.artwork_id = a.id
    `;
    const params = [];
    
    if (status && ['pending', 'confirmed', 'cancelled', 'refused'].includes(status)) {
        sql += ' WHERE o.status = ?';
        params.push(status);
    }
    sql += ' ORDER BY o.order_date DESC';

    try {
        const [orders] = await db.query(sql, params);
        res.json(orders);
    } catch (error) {
        console.error('Erreur getAllOrders:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'confirmed', 'cancelled', 'refused'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide' });
    }
    
    try {
        const [orders] = await db.query('SELECT id FROM orders WHERE id = ?', [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
        res.json({ message: `Statut de la commande mis à jour : ${status}` });
    } catch (error) {
        console.error('Erreur updateOrderStatus:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la commande' });
    }
};

// =============================================
// STATISTIQUES AVANCÉES
// =============================================

exports.getAdvancedStats = async (req, res) => {
    try {
        const [monthlyStats] = await db.query(`
            SELECT 
                DATE_FORMAT(order_date, '%Y-%m') as month,
                COUNT(*) as total_orders,
                SUM(amount) as revenue
            FROM orders
            WHERE status = 'confirmed'
            GROUP BY DATE_FORMAT(order_date, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        `);
        
        const [topCategories] = await db.query(`
            SELECT 
                category,
                COUNT(*) as count
            FROM artworks
            WHERE status = 'active'
            GROUP BY category
            ORDER BY count DESC
            LIMIT 5
        `);
        
        const [userActivity] = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(DISTINCT user_id) as active_users,
                COUNT(*) as new_artworks
            FROM artworks
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);
        
        res.json({
            monthly_stats: monthlyStats,
            top_categories: topCategories,
            user_activity: userActivity
        });
    } catch (error) {
        console.error('Erreur getAdvancedStats:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques avancées' });
    }
};

// Traitement groupé des signalements
exports.bulkResolveReports = async (req, res) => {
    const { reportIds, action } = req.body;
    
    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
        return res.status(400).json({ error: 'Liste d\'IDs de signalements requise' });
    }
    
    if (!action || !['ignore', 'suspend'].includes(action)) {
        return res.status(400).json({ error: 'Action requise: "ignore" ou "suspend"' });
    }

    try {
        for (const reportId of reportIds) {
            const [reports] = await db.query(
                `SELECT * FROM reports WHERE id = ? AND status = "pending"`,
                [reportId]
            );
            
            if (reports.length > 0) {
                const report = reports[0];
                
                if (action === 'suspend') {
                    if (report.target_user_id) {
                        await db.query('UPDATE users SET is_suspended = TRUE WHERE id = ?', [report.target_user_id]);
                        await db.query('UPDATE artworks SET status = "suspended" WHERE user_id = ?', [report.target_user_id]);
                    }
                    if (report.target_artwork_id) {
                        await db.query('UPDATE artworks SET status = "suspended" WHERE id = ?', [report.target_artwork_id]);
                    }
                }
                
                await db.query('UPDATE reports SET status = "resolved" WHERE id = ?', [reportId]);
            }
        }
        
        res.json({ 
            message: `${reportIds.length} signalement(s) traités avec succès`,
            action: action
        });
    } catch (error) {
        console.error('Erreur bulkResolveReports:', error);
        res.status(500).json({ error: 'Erreur lors du traitement des signalements' });
    }
};