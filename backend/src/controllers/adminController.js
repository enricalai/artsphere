const db = require('../config/db');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');

// =============================================
// STATISTIQUES DU TABLEAU DE BORD
// =============================================

exports.getDashboardStats = async (req, res) => {
    try {
        console.log('📊 Récupération des statistiques du tableau de bord...');
        
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

        console.log('✅ Statistiques récupérées avec succès');
        
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
        console.error('❌ Erreur getDashboardStats:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
};

// =============================================
// GESTION DES UTILISATEURS
// =============================================

exports.getAllUsers = async (req, res) => {
    try {
        console.log('👥 Récupération de tous les utilisateurs...');
        
        const [users] = await db.query(
            `SELECT id, email, nom, sexe, age, ville, pays, avatar_url, role, is_suspended, created_at,
             (SELECT COUNT(*) FROM artworks WHERE user_id = users.id) as artworks_count
             FROM users
             ORDER BY created_at DESC`
        );
        
        console.log(`✅ ${users.length} utilisateurs récupérés`);
        res.json(users);
        
    } catch (error) {
        console.error('❌ Erreur getAllUsers:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
};

exports.getUserById = async (req, res) => {
    const { userId } = req.params;
    try {
        console.log(`🔍 Récupération de l'utilisateur ${userId}...`);
        
        const [users] = await db.query(
            `SELECT id, email, nom, sexe, age, ville, pays, avatar_url, role, is_suspended, created_at,
             (SELECT COUNT(*) FROM artworks WHERE user_id = users.id) as artworks_count
             FROM users
             WHERE id = ?`,
            [userId]
        );
        
        if (users.length === 0) {
            console.log(`❌ Utilisateur ${userId} non trouvé`);
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        console.log(`✅ Utilisateur ${userId} récupéré`);
        res.json(users[0]);
        
    } catch (error) {
        console.error(`❌ Erreur getUserById pour ${userId}:`, error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
    }
};

exports.suspendUser = async (req, res) => {
    const { userId } = req.params;
    try {
        console.log(`🔒 Suspension manuelle de l'utilisateur ${userId}...`);
        
        const [users] = await db.query('SELECT role, email, nom FROM users WHERE id = ?', [userId]);

        if (users.length === 0) {
            console.log(`❌ Utilisateur ${userId} non trouvé`);
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        if (users[0].role === 'admin') {
            console.log(`⛔ Tentative de suspension d'un admin ${users[0].email} - Refusé`);
            return res.status(403).json({ error: 'Impossible de suspendre un admin' });
        }

        // Exécuter les requêtes sans transaction (plus simple)
        await db.query('UPDATE users SET is_suspended = TRUE WHERE id = ?', [userId]);
        await db.query('UPDATE artworks SET status = "suspended" WHERE user_id = ?', [userId]);
        
        console.log(`✅ Utilisateur ${userId} (${users[0].email}) suspendu manuellement`);
        res.json({ message: 'Utilisateur et ses œuvres suspendus' });
        
    } catch (error) {
        console.error(`❌ Erreur suspendUser pour ${userId}:`, error);
        res.status(500).json({ error: 'Erreur lors de la suspension' });
    }
};

exports.unsuspendUser = async (req, res) => {
    const { userId } = req.params;
    try {
        console.log(`🔓 Réactivation de l'utilisateur ${userId}...`);
        
        const [users] = await db.query('SELECT role, email FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) {
            console.log(`❌ Utilisateur ${userId} non trouvé`);
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        await db.query('UPDATE users SET is_suspended = FALSE WHERE id = ?', [userId]);
        await db.query('UPDATE artworks SET status = "active" WHERE user_id = ? AND status = "suspended"', [userId]);
        
        console.log(`✅ Utilisateur ${userId} (${users[0].email}) réactivé`);
        res.json({ message: 'Utilisateur réactivé avec succès' });
        
    } catch (error) {
        console.error(`❌ Erreur unsuspendUser pour ${userId}:`, error);
        res.status(500).json({ error: 'Erreur lors de la réactivation' });
    }
};

exports.deleteUser = async (req, res) => {
    const { userId } = req.params;
    try {
        console.log(`🗑️ Suppression de l'utilisateur ${userId}...`);
        
        const [users] = await db.query('SELECT role, avatar_url, email FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) {
            console.log(`❌ Utilisateur ${userId} non trouvé`);
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        if (users[0].role === 'admin') {
            console.log(`⛔ Tentative de suppression d'un admin ${users[0].email} - Refusé`);
            return res.status(403).json({ error: 'Impossible de supprimer un admin' });
        }
        
        // Supprimer l'avatar si existant
        if (users[0].avatar_url) {
            try {
                await fs.unlink(users[0].avatar_url);
                console.log(`🗑️ Avatar supprimé: ${users[0].avatar_url}`);
            } catch (err) {
                console.warn(`⚠️ Impossible de supprimer l'avatar : ${users[0].avatar_url}`);
            }
        }
        
        // Supprimer toutes les œuvres de l'utilisateur
        const [artworks] = await db.query('SELECT image_url, watermark_url FROM artworks WHERE user_id = ?', [userId]);
        for (const artwork of artworks) {
            const filesToDelete = [artwork.image_url, artwork.watermark_url].filter(path => path);
            for (const path of filesToDelete) {
                try {
                    await fs.unlink(path);
                    console.log(`🗑️ Fichier supprimé: ${path}`);
                } catch (err) {
                    console.warn(`⚠️ Impossible de supprimer le fichier : ${path}`);
                }
            }
        }
        
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        
        console.log(`✅ Utilisateur ${userId} (${users[0].email}) supprimé avec toutes ses données`);
        res.json({ message: 'Utilisateur et toutes ses données supprimés' });
    } catch (error) {
        console.error(`❌ Erreur deleteUser pour ${userId}:`, error);
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
        console.log(`👤 Création d'un administrateur: ${email}...`);
        
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            console.log(`❌ Email ${email} déjà utilisé`);
            return res.status(400).json({ error: 'Email déjà utilisé' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (email, password, nom, role) VALUES (?, ?, ?, "admin")',
            [email, hashedPassword, nom]
        );

        console.log(`✅ Administrateur créé avec succès: ID ${result.insertId} - ${email}`);
        res.status(201).json({ 
            message: 'Administrateur créé avec succès', 
            id: result.insertId 
        });
    } catch (error) {
        console.error('❌ Erreur createAdmin:', error);
        res.status(500).json({ error: 'Erreur lors de la création de l\'administrateur' });
    }
};

exports.getAllAdmins = async (req, res) => {
    try {
        console.log('👥 Récupération des administrateurs...');
        
        const [admins] = await db.query(
            `SELECT id, email, nom, created_at 
             FROM users 
             WHERE role = 'admin' 
             ORDER BY created_at DESC`
        );
        
        console.log(`✅ ${admins.length} administrateurs récupérés`);
        res.json(admins);
    } catch (error) {
        console.error('❌ Erreur getAllAdmins:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des administrateurs' });
    }
};

exports.deleteAdmin = async (req, res) => {
    const { adminId } = req.params;
    try {
        console.log(`🗑️ Suppression de l'administrateur ${adminId}...`);
        
        const [admins] = await db.query('SELECT role, email FROM users WHERE id = ?', [adminId]);
        
        if (admins.length === 0) {
            console.log(`❌ Administrateur ${adminId} non trouvé`);
            return res.status(404).json({ error: 'Administrateur non trouvé' });
        }
        
        if (admins[0].role !== 'admin') {
            console.log(`❌ L'utilisateur ${adminId} n'est pas un administrateur`);
            return res.status(400).json({ error: 'Cet utilisateur n\'est pas un administrateur' });
        }
        
        // Vérifier qu'il reste au moins un admin
        const [adminCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
        if (adminCount[0].count <= 1) {
            console.log(`⛔ Impossible de supprimer le dernier administrateur`);
            return res.status(400).json({ error: 'Impossible de supprimer le dernier administrateur' });
        }
        
        await db.query('DELETE FROM users WHERE id = ?', [adminId]);
        
        console.log(`✅ Administrateur ${adminId} (${admins[0].email}) supprimé`);
        res.json({ message: 'Administrateur supprimé avec succès' });
    } catch (error) {
        console.error(`❌ Erreur deleteAdmin pour ${adminId}:`, error);
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
        console.log(`🚨 Nouveau signalement de l'utilisateur ${reporterId}...`);
        console.log(`📝 Détails: targetUserId=${targetUserId}, targetArtworkId=${targetArtworkId}, reason=${reason}`);

        if (targetUserId && parseInt(targetUserId) === reporterId) {
            console.log(`⛔ Tentative d'auto-signalement par l'utilisateur ${reporterId}`);
            return res.status(400).json({ error: 'Vous ne pouvez pas vous signaler vous-même' });
        }

        let actualTargetUserId = targetUserId;
        let actualTargetArtworkId = targetArtworkId;
        let artworkOwnerId = null;

        // 🔍 Si on signale une œuvre, on récupère son artiste
        if (targetArtworkId) {
            const [artwork] = await db.query(
                'SELECT user_id, title FROM artworks WHERE id = ?',
                [targetArtworkId]
            );
            
            if (artwork.length === 0) {
                console.log(`❌ Œuvre ${targetArtworkId} non trouvée`);
                return res.status(404).json({ error: 'Œuvre non trouvée' });
            }
            
            artworkOwnerId = artwork[0].user_id;
            console.log(`🖼️ Œuvre trouvée: "${artwork[0].title}" (ID: ${targetArtworkId}) - Artiste: ${artworkOwnerId}`);
            
            if (!actualTargetUserId) {
                actualTargetUserId = artworkOwnerId;
                console.log(`🔄 Signalement d'œuvre → artiste ${actualTargetUserId} automatiquement ajouté`);
            }
        }

        if (artworkOwnerId && artworkOwnerId === reporterId) {
            console.log(`⛔ Tentative de signalement de sa propre œuvre par l'utilisateur ${reporterId}`);
            return res.status(400).json({ error: 'Vous ne pouvez pas signaler votre propre œuvre' });
        }

        // ✅ Vérification des doublons MODIFIÉE
        let existingReport = [];
        
        // Si on signale une œuvre spécifique, vérifier qu'on n'a pas déjà signalé CETTE œuvre
        if (actualTargetArtworkId) {
            [existingReport] = await db.query(
                `SELECT id FROM reports 
                 WHERE reporter_id = ? AND target_artwork_id = ? AND status = 'pending'`,
                [reporterId, actualTargetArtworkId]
            );
        }
        
        // Si on signale directement un utilisateur (sans œuvre spécifique)
        if (existingReport.length === 0 && actualTargetUserId && !actualTargetArtworkId) {
            [existingReport] = await db.query(
                `SELECT id FROM reports 
                 WHERE reporter_id = ? AND target_user_id = ? AND status = 'pending' AND target_artwork_id IS NULL`,
                [reporterId, actualTargetUserId]
            );
        }

        if (existingReport.length > 0) {
            console.log(`⚠️ Signalement déjà existant pour cette cible spécifique`);
            if (actualTargetArtworkId) {
                return res.status(400).json({ error: 'Vous avez déjà signalé cette œuvre' });
            } else {
                return res.status(400).json({ error: 'Vous avez déjà signalé cet utilisateur' });
            }
        }

        // Insérer le signalement
        await db.query(
            `INSERT INTO reports 
             (reporter_id, target_user_id, target_artwork_id, reason, status, created_at) 
             VALUES (?, ?, ?, ?, 'pending', NOW())`,
            [reporterId, actualTargetUserId || null, actualTargetArtworkId || null, reason]
        );

        console.log(`✅ Signalement créé avec succès`);

        // 🔍 Vérifier suspension auto
        if (actualTargetUserId) {
            console.log(`🔍 Vérification automatique pour l'utilisateur ${actualTargetUserId}...`);
            await exports.checkAndAutoSuspend(actualTargetUserId);
        }

        res.status(201).json({ 
            message: 'Signalement envoyé avec succès'
        });

    } catch (error) {
        console.error(`❌ Erreur createReport:`, error);
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
        console.log(`📋 Récupération des signalements (filtre: ${status || 'tous'})...`);
        
        const [reports] = await db.query(sql, params);
        
        console.log(`✅ ${reports.length} signalements récupérés`);
        res.json(reports);
    } catch (error) {
        console.error('❌ Erreur getAllReports:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des signalements' });
    }
};

exports.getReportById = async (req, res) => {
    const { reportId } = req.params;
    try {
        console.log(`🔍 Récupération du signalement ${reportId}...`);
        
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
            console.log(`❌ Signalement ${reportId} non trouvé`);
            return res.status(404).json({ error: 'Signalement non trouvé' });
        }
        
        console.log(`✅ Signalement ${reportId} récupéré`);
        res.json(reports[0]);
    } catch (error) {
        console.error(`❌ Erreur getReportById pour ${reportId}:`, error);
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
        console.log(`⚖️ Traitement du signalement ${reportId} avec l'action "${action}"...`);
        
        const [reports] = await db.query(
            `SELECT * FROM reports WHERE id = ? AND status = "pending"`,
            [reportId]
        );

        if (reports.length === 0) {
            console.log(`❌ Signalement ${reportId} non trouvé ou déjà traité`);
            return res.status(404).json({ error: 'Signalement non trouvé ou déjà traité' });
        }

        const report = reports[0];

        if (action === 'suspend') {
            if (report.target_user_id) {
                console.log(`🔒 Suspension de l'utilisateur ${report.target_user_id} via signalement`);
                await db.query('UPDATE users SET is_suspended = TRUE WHERE id = ?', [report.target_user_id]);
                await db.query('UPDATE artworks SET status = "suspended" WHERE user_id = ?', [report.target_user_id]);
            }
            if (report.target_artwork_id) {
                console.log(`🔒 Suspension de l'œuvre ${report.target_artwork_id} via signalement`);
                await db.query('UPDATE artworks SET status = "suspended" WHERE id = ?', [report.target_artwork_id]);
            }
        }

        await db.query('UPDATE reports SET status = "resolved" WHERE id = ?', [reportId]);
        
        console.log(`✅ Signalement ${reportId} traité avec succès (${action})`);
        res.json({ 
            message: action === 'suspend' ? 'Signalement traité : contenu suspendu' : 'Signalement ignoré'
        });
        
    } catch (error) {
        console.error(`❌ Erreur resolveReport pour ${reportId}:`, error);
        res.status(500).json({ error: 'Erreur lors du traitement du signalement' });
    }
};

// =============================================
// VÉRIFICATION ET SUSPENSION AUTOMATIQUE
// =============================================

exports.checkAndAutoSuspend = async (userId) => {
    console.log(`🔍 Vérification suspension pour l'utilisateur ${userId}`);
    
    try {
        const [userCheck] = await db.query(
            'SELECT id, email, nom, role, is_suspended FROM users WHERE id = ?', 
            [userId]
        );
        
        if (userCheck.length === 0) {
            console.log(`❌ Utilisateur ${userId} inexistant`);
            return false;
        }
        
        const user = userCheck[0];
        console.log(`👤 Utilisateur trouvé: ${user.email} (${user.nom}) - Rôle: ${user.role}`);
        
        if (user.role === 'admin') {
            console.log(`⛔ Tentative de suspension d'un admin (${user.email}) - Ignoré`);
            return false;
        }
        
        if (user.is_suspended) {
            console.log(`ℹ️ Utilisateur ${userId} (${user.email}) déjà suspendu`);
            return false;
        }
        
        // ✅ UNIQUEMENT les signalements directs (target_user_id)
        const [reports] = await db.query(
            `SELECT COUNT(*) as count 
             FROM reports 
             WHERE target_user_id = ? AND status = 'pending'`,
            [userId]
        );
        
        const totalPendingReports = reports[0]?.count || 0;
        
        console.log(`📊 Statistiques des signalements pour ${user.email}:`);
        console.log(`   - Signalements totaux: ${totalPendingReports}`);

        if (totalPendingReports >= 3) {
            console.log(`⚠️ ${totalPendingReports} signalements détectés pour ${user.email} (seuil: 3), suspension en cours...`);
            
            // 1. Suspendre l'utilisateur
            await db.query('UPDATE users SET is_suspended = TRUE WHERE id = ?', [userId]);
            console.log(`✅ Utilisateur ${userId} (${user.email}) marqué comme suspendu`);
            
            // 2. Suspendre TOUTES ses œuvres
            const [artworkResult] = await db.query(
                'UPDATE artworks SET status = "suspended" WHERE user_id = ?', 
                [userId]
            );
            console.log(`✅ ${artworkResult.affectedRows} œuvres suspendues`);
            
            // 3. Résoudre TOUS les signalements en attente
            await db.query(
                `UPDATE reports SET status = 'resolved' 
                 WHERE target_user_id = ? AND status = 'pending'`,
                [userId]
            );
            
            console.log(`🔒 UTILISATEUR SUSPENDU AUTOMATIQUEMENT:`);
            console.log(`   - ID: ${userId}`);
            console.log(`   - Email: ${user.email}`);
            console.log(`   - Signalements totaux: ${totalPendingReports}`);
            
            return true;
        } else {
            console.log(`ℹ️ ${totalPendingReports}/3 signalements, pas de suspension pour ${user.email}`);
            return false;
        }
        
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
        console.log(`🖼️ Récupération des œuvres (filtre: ${status || 'tous'})...`);
        
        const [artworks] = await db.query(sql, params);
        
        console.log(`✅ ${artworks.length} œuvres récupérées`);
        res.json(artworks);
    } catch (error) {
        console.error('❌ Erreur getAllArtworks:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des œuvres' });
    }
};

exports.getArtworkById = async (req, res) => {
    const { artworkId } = req.params;
    try {
        console.log(`🔍 Récupération de l'œuvre ${artworkId}...`);
        
        const [artworks] = await db.query(
            `SELECT a.*, u.nom as artist_name, u.email as artist_email, u.id as artist_id
             FROM artworks a
             JOIN users u ON a.user_id = u.id
             WHERE a.id = ?`,
            [artworkId]
        );
        
        if (artworks.length === 0) {
            console.log(`❌ Œuvre ${artworkId} non trouvée`);
            return res.status(404).json({ error: 'Œuvre non trouvée' });
        }
        
        console.log(`✅ Œuvre ${artworkId} récupérée`);
        res.json(artworks[0]);
    } catch (error) {
        console.error(`❌ Erreur getArtworkById pour ${artworkId}:`, error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'œuvre' });
    }
};

exports.adminDeleteArtwork = async (req, res) => {
    const { artworkId } = req.params;
    try {
        console.log(`🗑️ Suppression de l'œuvre ${artworkId}...`);
        
        const [artworks] = await db.query('SELECT image_url, watermark_url FROM artworks WHERE id = ?', [artworkId]);
        if (artworks.length === 0) {
            console.log(`❌ Œuvre ${artworkId} non trouvée`);
            return res.status(404).json({ error: 'Œuvre non trouvée' });
        }

        const artwork = artworks[0];

        const filesToDelete = [artwork.image_url, artwork.watermark_url].filter(path => path && path !== '');
        
        for (const path of filesToDelete) {
            try {
                await fs.unlink(path);
                console.log(`🗑️ Fichier supprimé : ${path}`);
            } catch (err) {
                console.warn(`⚠️ Impossible de supprimer le fichier : ${path}`, err.message);
            }
        }

        await db.query('DELETE FROM artworks WHERE id = ?', [artworkId]);
        
        console.log(`✅ Œuvre ${artworkId} supprimée avec ses fichiers`);
        res.json({ message: 'Œuvre et ses fichiers supprimés avec succès' });
    } catch (error) {
        console.error(`❌ Erreur adminDeleteArtwork pour ${artworkId}:`, error);
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
        console.log(`🔄 Mise à jour du statut de l'œuvre ${artworkId} vers "${status}"...`);
        
        const [artworks] = await db.query('SELECT id FROM artworks WHERE id = ?', [artworkId]);
        if (artworks.length === 0) {
            console.log(`❌ Œuvre ${artworkId} non trouvée`);
            return res.status(404).json({ error: 'Œuvre non trouvée' });
        }
        
        await db.query('UPDATE artworks SET status = ? WHERE id = ?', [status, artworkId]);
        
        console.log(`✅ Statut de l'œuvre ${artworkId} mis à jour vers "${status}"`);
        res.json({ message: `Statut de l'œuvre mis à jour : ${status}` });
    } catch (error) {
        console.error(`❌ Erreur adminUpdateArtworkStatus pour ${artworkId}:`, error);
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
        console.log(`📦 Récupération des commandes (filtre: ${status || 'tous'})...`);
        
        const [orders] = await db.query(sql, params);
        
        console.log(`✅ ${orders.length} commandes récupérées`);
        res.json(orders);
    } catch (error) {
        console.error('❌ Erreur getAllOrders:', error);
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
        console.log(`🔄 Mise à jour du statut de la commande ${orderId} vers "${status}"...`);
        
        const [orders] = await db.query('SELECT id FROM orders WHERE id = ?', [orderId]);
        if (orders.length === 0) {
            console.log(`❌ Commande ${orderId} non trouvée`);
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
        
        console.log(`✅ Statut de la commande ${orderId} mis à jour vers "${status}"`);
        res.json({ message: `Statut de la commande mis à jour : ${status}` });
    } catch (error) {
        console.error(`❌ Erreur updateOrderStatus pour ${orderId}:`, error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la commande' });
    }
};

// =============================================
// STATISTIQUES AVANCÉES
// =============================================

exports.getAdvancedStats = async (req, res) => {
    try {
        console.log('📊 Récupération des statistiques avancées...');
        
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
        
        console.log('✅ Statistiques avancées récupérées');
        
        res.json({
            monthly_stats: monthlyStats,
            top_categories: topCategories,
            user_activity: userActivity
        });
    } catch (error) {
        console.error('❌ Erreur getAdvancedStats:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques avancées' });
    }
};

// =============================================
// TRAITEMENT GROUPÉ DES SIGNALEMENTS
// =============================================

exports.bulkResolveReports = async (req, res) => {
    const { reportIds, action } = req.body;
    
    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
        return res.status(400).json({ error: 'Liste d\'IDs de signalements requise' });
    }
    
    if (!action || !['ignore', 'suspend'].includes(action)) {
        return res.status(400).json({ error: 'Action requise: "ignore" ou "suspend"' });
    }

    try {
        console.log(`📋 Traitement groupé de ${reportIds.length} signalements avec l'action "${action}"...`);
        
        let processedCount = 0;
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
                processedCount++;
            }
        }
        
        console.log(`✅ ${processedCount} signalements traités avec succès`);
        res.json({ 
            message: `${processedCount} signalement(s) traités avec succès`,
            action: action
        });
    } catch (error) {
        console.error('❌ Erreur bulkResolveReports:', error);
        res.status(500).json({ error: 'Erreur lors du traitement des signalements' });
    }
};

// =============================================
// EXPORT DU MODULE
// =============================================

module.exports = exports;