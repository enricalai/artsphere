const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // À ajouter en haut du fichier
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// INSCRIPTION
exports.register = async (req, res) => {
    const { email, password, nom, sexe, age, ville, pays, bio } = req.body;
    
    if (!email || !password || !nom || !sexe) {
        return res.status(400).json({ error: 'Email, mot de passe, nom et sexe sont requis' });
    }
    
    if (!['homme', 'femme'].includes(sexe)) {
        return res.status(400).json({ error: 'Le sexe doit être "homme" ou "femme"' });
    }
    
    if (age !== undefined && age !== null && age !== '') {
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 13 || ageNum > 80) {
            return res.status(400).json({ error: 'L\'âge doit être compris entre 13 et 80 ans' });
        }
    }
    
    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.query(
            `INSERT INTO users (email, password, nom, sexe, age, ville, pays, bio, role) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'user')`,
            [email, hashedPassword, nom, sexe, age || null, ville || null, pays || null, bio || null]
        );
        
        const token = jwt.sign(
            { id: result.insertId, email, nom: nom, sexe, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            message: 'Inscription réussie',
            token,
            user: {
                id: result.insertId,
                email,
                nom,
                sexe,
                role: 'user'
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
};

// CONNEXION
exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        
        const user = users[0];
        
        if (user.is_suspended) {
            return res.status(403).json({ error: 'Votre compte a été suspendu. Contactez l\'administrateur.' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, nom: user.nom, sexe: user.sexe, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                email: user.email,
                nom: user.nom,
                sexe: user.sexe,
                role: user.role,
                age: user.age,
                ville: user.ville,
                pays: user.pays,
                bio: user.bio,
                avatar_url: user.avatar_url
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
};

// RÉCUPÉRER SON PROFIL
exports.getProfile = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, email, nom, sexe, age, ville, pays, bio, avatar_url, role, created_at 
             FROM users WHERE id = ?`,
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        res.json(users[0]);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
    }
};

// MODIFIER SON PROFIL (avec suppression d'avatar possible)
exports.updateProfile = async (req, res) => {
    const { nom, sexe, age, ville, pays, bio, deleteAvatar } = req.body;
    let avatar_url = null;
    let query = 'UPDATE users SET nom = ?, sexe = ?, age = ?, ville = ?, pays = ?, bio = ?';
    let params = [nom || null, sexe || null, age || null, ville || null, pays || null, bio || null];

    // Validation du sexe
    if (sexe && !['homme', 'femme'].includes(sexe)) {
        return res.status(400).json({ error: 'Le sexe doit être "homme" ou "femme"' });
    }

    // Validation de l'âge
    if (age !== undefined && age !== null && age !== '') {
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 13 || ageNum > 80) {
            return res.status(400).json({ error: 'L\'âge doit être compris entre 13 et 80 ans' });
        }
    }
    
    try {
        // Récupérer l'ancien avatar
        const [userInfo] = await db.query('SELECT avatar_url FROM users WHERE id = ?', [req.user.id]);
        const oldAvatar = userInfo[0]?.avatar_url;
        
        // Suppression demandée
        if (deleteAvatar === 'true') {
            if (oldAvatar && fs.existsSync(oldAvatar)) {
                try {
                    fs.unlinkSync(oldAvatar);
                    console.log('✅ Ancien avatar supprimé:', oldAvatar);
                } catch (err) {
                    console.error('Erreur suppression fichier:', err);
                }
            }
            query += ', avatar_url = NULL';
        }
        
        // Nouvelle image uploadée
        if (req.file && deleteAvatar !== 'true') {
            if (oldAvatar && fs.existsSync(oldAvatar)) {
                try {
                    fs.unlinkSync(oldAvatar);
                    console.log('✅ Ancien avatar supprimé:', oldAvatar);
                } catch (err) {
                    console.error('Erreur suppression fichier:', err);
                }
            }
            avatar_url = req.file.path;
            query += ', avatar_url = ?';
            params.push(avatar_url);
        }
        
        query += ' WHERE id = ?';
        params.push(req.user.id);
        
        await db.query(query, params);
        
        // Retourner la nouvelle URL
        let newAvatarUrl = null;
        if (deleteAvatar === 'true') {
            newAvatarUrl = null;
        } else if (avatar_url) {
            newAvatarUrl = avatar_url;
        } else {
            newAvatarUrl = oldAvatar;
        }
        
        res.json({ 
            message: 'Profil mis à jour avec succès',
            avatar_url: newAvatarUrl
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
    }
};

// CHANGER LE MOT DE PASSE
exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 6 caractères' });
    }
    
    try {
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        const isPasswordValid = await bcrypt.compare(oldPassword, users[0].password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
        
        res.json({ message: 'Mot de passe modifié avec succès' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
    }
};

// DEMANDE DE RÉINITIALISATION
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email requis' });
    }

    try {
        // Vérifier si l'email existe
        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            // Pour des raisons de sécurité, on ne révèle pas que l'email n'existe pas
            return res.status(200).json({ message: 'Si cet email existe, vous recevrez un lien de réinitialisation.' });
        }

        // Générer un token unique
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 heure

        // Supprimer les anciens tokens pour cet email
        await db.query('DELETE FROM password_resets WHERE email = ?', [email]);

        // Enregistrer le nouveau token
        await db.query(
            'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
            [email, token, expiresAt]
        );

        // Lien de réinitialisation
        const resetLink = `http://localhost:3000/reset-password?token=${token}`;

        // Simuler l'envoi d'email (pour le développement, on affiche le lien dans la console)
        console.log('🔗 LIEN DE RÉINITIALISATION :', resetLink);

        // En production, utiliser Nodemailer ici
        // await sendEmail(email, 'Réinitialisation mot de passe ArtSphere', `Cliquez ici : ${resetLink}`);

        res.json({
            message: 'Si cet email existe, vous recevrez un lien de réinitialisation.',
            resetLink // Pour le dev uniquement – à supprimer en production
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la demande' });
    }
};

// RÉINITIALISATION DU MOT DE PASSE
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    try {
        // Vérifier le token
        const [resets] = await db.query(
            'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW() AND used = FALSE',
            [token]
        );

        if (resets.length === 0) {
            return res.status(400).json({ error: 'Lien invalide ou expiré' });
        }

        const reset = resets[0];

        // Hacher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour le mot de passe de l'utilisateur
        await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, reset.email]);

        // Marquer le token comme utilisé
        await db.query('UPDATE password_resets SET used = TRUE WHERE id = ?', [reset.id]);

        res.json({ message: 'Mot de passe modifié avec succès. Vous pouvez maintenant vous connecter.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
    }
};