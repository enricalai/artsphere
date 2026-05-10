const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// PUBLIER UNE ŒUVRE
exports.createArtwork = async (req, res) => {
    console.log('🎨 createArtwork: Début de la création');
    const { title, description, category, medium, dimensions, format, price, isAvailable } = req.body;
    const userId = req.user.id;
    
    console.log(`📝 Données reçues - Titre: ${title}, Catégorie: ${category}, UserId: ${userId}`);
    
    if (!title || !req.file || !category) {
        console.log('❌ Champs requis manquants');
        return res.status(400).json({ error: 'Titre, image et catégorie sont requis' });
    }
    
    // Convertir isAvailable (peut venir comme string 'true'/'false' ou boolean)
    const available = isAvailable === 'true' || isAvailable === true;
    console.log(`🔄 isAvailable converti: ${available}`);
    
    // Validation du prix
    let finalPrice = null;
    if (available) {
        if (price !== undefined && price !== null && price !== '') {
            const priceNum = parseFloat(price);
            if (isNaN(priceNum) || priceNum <= 0) {
                console.log('❌ Prix invalide:', price);
                return res.status(400).json({ error: 'Le prix doit être un nombre positif' });
            }
            finalPrice = priceNum;
            console.log(`💰 Prix validé: ${finalPrice}`);
        } else {
            console.log('❌ Prix requis pour œuvre disponible');
            return res.status(400).json({ error: 'Le prix est requis pour une œuvre disponible à la vente' });
        }
    } else if (price !== undefined && price !== null && price !== '') {
        const priceNum = parseFloat(price);
        if (!isNaN(priceNum) && priceNum > 0) {
            finalPrice = priceNum;
            console.log(`💰 Prix non requis mais fourni: ${finalPrice}`);
        }
    }

    try {
        const originalPath = req.file.path;
        console.log(`📁 Chemin de l'image: ${originalPath}`);
        
        console.log('💾 Insertion dans la base de données...');
        const [result] = await db.query(
            `INSERT INTO artworks (user_id, title, description, category, medium, dimensions, format, image_url, price, is_available) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, title, description || null, category, medium || null, dimensions || null, format || null, originalPath, finalPrice, available ? 1 : 0]
        );
        
        console.log(`✅ Œuvre créée avec succès! ID: ${result.insertId}`);
        res.status(201).json({
            message: 'Œuvre publiée avec succès',
            artwork: {
                id: result.insertId,
                title,
                category,
                is_available: available,
                image_url: originalPath
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur création œuvre:', error);
        console.error('❌ Stack trace:', error.stack);
        if (req.file && fs.existsSync(req.file.path)) {
            console.log('🗑️ Suppression du fichier image...');
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Erreur lors de la publication', details: error.message });
    }
};

// RÉCUPÉRER TOUTES LES ŒUVRES
exports.getAllArtworks = async (req, res) => {
    console.log('📚 getAllArtworks: Début de la récupération');
    try {
        console.log('💾 Exécution de la requête SQL...');
        const [artworks] = await db.query(
            `SELECT a.*, u.nom as artist_name 
             FROM artworks a
             JOIN users u ON a.user_id = u.id
             WHERE a.status = 'active'
             ORDER BY a.created_at DESC`
        );
        
        console.log(`📊 ${artworks.length} œuvre(s) récupérée(s)`);
        
        const artworksWithBoolean = artworks.map(artwork => ({
            ...artwork,
            is_available: artwork.is_available === 1,
            is_sold: artwork.is_sold === 1
        }));
        
        console.log('✅ Envoi des œuvres au frontend');
        res.json(artworksWithBoolean);
    } catch (error) {
        console.error('❌ Erreur dans getAllArtworks:', error);
        console.error('❌ Stack trace:', error.stack);
        res.status(500).json({ error: 'Erreur de récupération', details: error.message });
    }
};

// RÉCUPÉRER UNE ŒUVRE PAR ID
exports.getArtworkById = async (req, res) => {
    const { id } = req.params;
    console.log(`🔍 getArtworkById: récupération de l'œuvre ID: ${id}`);
    
    try {
        console.log('📊 Exécution de la requête SQL...');
        const [artworks] = await db.query(
            `SELECT a.*, u.nom as artist_name 
             FROM artworks a
             JOIN users u ON a.user_id = u.id
             WHERE a.id = ?`,
            [id]
        );
        
        console.log(`📊 SQL terminée. ${artworks.length} œuvre(s) trouvée(s)`);
        
        if (artworks.length === 0) {
            console.log(`❌ Œuvre ${id} non trouvée`);
            return res.status(404).json({ error: 'Œuvre non trouvée' });
        }
        
        console.log('📊 Récupération du nombre de likes...');
        const [likeCount] = await db.query(
            'SELECT COUNT(*) as count FROM likes WHERE artwork_id = ?',
            [id]
        );
        
        console.log(`📊 ${likeCount[0].count} like(s) trouvé(s)`);
        
        const artwork = {
            ...artworks[0],
            likes_count: likeCount[0].count,
            is_available: artworks[0].is_available === 1,
            is_sold: artworks[0].is_sold === 1
        };
        
        console.log(`✅ Envoi de l'œuvre ${id} au frontend`);
        res.json(artwork);
        
    } catch (error) {
        console.error('❌ Erreur dans getArtworkById:', error);
        console.error('❌ Stack trace:', error.stack);
        res.status(500).json({ error: 'Erreur de récupération', details: error.message });
    }
};

// MODIFIER UNE ŒUVRE
exports.updateArtwork = async (req, res) => {
    const { id } = req.params;
    const { title, description, medium, dimensions, price, isAvailable } = req.body;
    const userId = req.user.id;
    
    console.log(`✏️ updateArtwork: Modification de l'œuvre ID: ${id} par l'utilisateur ${userId}`);
    console.log(`📝 Données reçues: title=${title}, price=${price}, isAvailable=${isAvailable}`);
    
    try {
        // Vérifier que l'œuvre existe et appartient à l'utilisateur
        console.log('🔍 Vérification de l\'œuvre...');
        const [artworks] = await db.query(
            'SELECT user_id, is_sold FROM artworks WHERE id = ?', 
            [id]
        );
        
        if (artworks.length === 0) {
            console.log(`❌ Œuvre ${id} non trouvée`);
            return res.status(404).json({ error: 'Œuvre non trouvée' });
        }
        
        console.log(`👤 Propriétaire: ${artworks[0].user_id}, Utilisateur actuel: ${userId}, Rôle: ${req.user.role}`);
        
        if (artworks[0].user_id !== userId && req.user.role !== 'admin') {
            console.log('❌ Non autorisé');
            return res.status(403).json({ error: 'Non autorisé' });
        }
        
        // Vérifier si l'œuvre n'est pas déjà vendue
        if (artworks[0].is_sold) {
            console.log('❌ Œuvre déjà vendue');
            return res.status(400).json({ error: 'Cette œuvre est déjà vendue et ne peut pas être modifiée' });
        }
        
        // Convertir isAvailable (peut venir comme string 'true'/'false' ou boolean)
        const available = isAvailable === 'true' || isAvailable === true;
        console.log(`🔄 isAvailable converti: ${available}`);
        
        // Validation du prix
        let finalPrice = null;
        if (available) {
            if (price !== undefined && price !== null && price !== '') {
                const priceNum = parseFloat(price);
                if (isNaN(priceNum) || priceNum <= 0) {
                    console.log('❌ Prix invalide:', price);
                    return res.status(400).json({ error: 'Le prix doit être un nombre positif' });
                }
                finalPrice = priceNum;
                console.log(`💰 Prix validé: ${finalPrice}`);
            } else {
                console.log('❌ Prix requis pour œuvre disponible');
                return res.status(400).json({ error: 'Le prix est requis pour une œuvre disponible à la vente' });
            }
        } else if (price !== undefined && price !== null && price !== '') {
            const priceNum = parseFloat(price);
            if (!isNaN(priceNum) && priceNum > 0) {
                finalPrice = priceNum;
                console.log(`💰 Prix non requis mais fourni: ${finalPrice}`);
            }
        }
        
        // Mise à jour
        console.log('💾 Mise à jour de la base de données...');
        await db.query(
            `UPDATE artworks 
             SET title = ?, description = ?, medium = ?, dimensions = ?, price = ?, is_available = ?
             WHERE id = ?`,
            [title, description || null, medium || null, dimensions || null, finalPrice, available ? 1 : 0, id]
        );
        
        console.log(`✅ Œuvre ${id} mise à jour avec succès`);
        res.json({ message: 'Œuvre mise à jour avec succès' });
        
    } catch (error) {
        console.error('❌ Erreur mise à jour œuvre:', error);
        console.error('❌ Stack trace:', error.stack);
        res.status(500).json({ error: 'Erreur lors de la mise à jour', details: error.message });
    }
};

// SUPPRIMER UNE ŒUVRE
exports.deleteArtwork = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log(`🗑️ deleteArtwork: Suppression de l'œuvre ID: ${id} par l'utilisateur ${userId}`);
    
    try {
        console.log('🔍 Récupération des infos de l\'œuvre...');
        const [artworks] = await db.query(
            'SELECT user_id, image_url FROM artworks WHERE id = ?', 
            [id]
        );
        
        if (artworks.length === 0) {
            console.log(`❌ Œuvre ${id} non trouvée`);
            return res.status(404).json({ error: 'Œuvre non trouvée' });
        }
        
        if (artworks[0].user_id !== userId && req.user.role !== 'admin') {
            console.log('❌ Non autorisé');
            return res.status(403).json({ error: 'Non autorisé' });
        }
        
        // Supprimer l'image du serveur
        if (artworks[0].image_url && fs.existsSync(artworks[0].image_url)) {
            console.log(`📁 Suppression du fichier: ${artworks[0].image_url}`);
            fs.unlinkSync(artworks[0].image_url);
        } else {
            console.log('⚠️ Fichier image non trouvé');
        }
        
        console.log('💾 Suppression de la base de données...');
        await db.query('DELETE FROM artworks WHERE id = ?', [id]);
        
        console.log(`✅ Œuvre ${id} supprimée avec succès`);
        res.json({ message: 'Œuvre supprimée avec succès' });
        
    } catch (error) {
        console.error('❌ Erreur suppression œuvre:', error);
        console.error('❌ Stack trace:', error.stack);
        res.status(500).json({ error: 'Erreur lors de la suppression', details: error.message });
    }
};

// RÉCUPÉRER LES ŒUVRES D'UN UTILISATEUR
exports.getUserArtworks = async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    console.log(`👤 getUserArtworks: Récupération œuvres de l'utilisateur ${userId}`);
    console.log(`🔑 Utilisateur actuel: ${currentUserId}, Rôle: ${req.user.role}`);
    
    try {
        let query = `
            SELECT a.*, u.nom as artist_name 
            FROM artworks a
            JOIN users u ON a.user_id = u.id
            WHERE a.user_id = ?
        `;
        
        const params = [userId];
        
        // Si ce n'est pas le propriétaire ou admin, ne montrer que les œuvres disponibles
        if (parseInt(userId) !== currentUserId && req.user.role !== 'admin') {
            query += ` AND a.is_available = true AND a.status = 'active'`;
            console.log('📊 Filtre: seulement œuvres disponibles');
        } else {
            console.log('📊 Accès complet: propriétaire ou admin');
        }
        
        query += ` ORDER BY a.created_at DESC`;
        
        console.log('💾 Exécution de la requête SQL...');
        const [artworks] = await db.query(query, params);
        
        console.log(`📊 ${artworks.length} œuvre(s) trouvée(s)`);
        
        const artworksWithBoolean = artworks.map(artwork => ({
            ...artwork,
            is_available: artwork.is_available === 1,
            is_sold: artwork.is_sold === 1
        }));
        
        console.log('✅ Envoi des œuvres au frontend');
        res.json(artworksWithBoolean);
        
    } catch (error) {
        console.error('❌ Erreur récupération œuvres utilisateur:', error);
        console.error('❌ Stack trace:', error.stack);
        res.status(500).json({ error: 'Erreur de récupération', details: error.message });
    }
};