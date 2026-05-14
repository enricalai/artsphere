const db = require('../config/db');
const fs = require('fs');

// RÉCUPÉRER TOUTES LES ŒUVRES (avec pagination)
exports.getAllArtworks = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    try {
        const [artworks] = await db.query(
            `SELECT a.*, u.nom as artist_name 
             FROM artworks a
             JOIN users u ON a.user_id = u.id
             WHERE a.status = 'active'
             ORDER BY a.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [[{ total }]] = await db.query(
            'SELECT COUNT(*) as total FROM artworks WHERE status = "active"'
        );

        const totalPages = Math.ceil(total / limit);

        res.json({
            data: artworks,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur de récupération' });
    }
};

// RÉCUPÉRER UNE ŒUVRE PAR ID
exports.getArtworkById = async (req, res) => {
    const { id } = req.params;
    try {
        const [artworks] = await db.query(
            `SELECT a.*, u.nom as artist_name 
             FROM artworks a
             JOIN users u ON a.user_id = u.id
             WHERE a.id = ?`,
            [id]
        );
        if (artworks.length === 0) {
            return res.status(404).json({ error: 'Œuvre non trouvée' });
        }
        
        const [likeCount] = await db.query(
            'SELECT COUNT(*) as count FROM likes WHERE artwork_id = ?',
            [id]
        );
        
        res.json({
            ...artworks[0],
            likes_count: likeCount[0].count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur de récupération' });
    }
};

// PUBLIER UNE ŒUVRE
exports.createArtwork = async (req, res) => {
    const { title, description, category, medium, dimensions, format, price, isAvailable } = req.body;
    const userId = req.user.id;
    
    if (!title || !req.file || !category) {
        return res.status(400).json({ error: 'Titre, image et catégorie sont requis' });
    }
    
    const available = isAvailable === 'true' || isAvailable === true;
    let finalPrice = null;
    
    if (available && price !== undefined && price !== null && price !== '') {
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            return res.status(400).json({ error: 'Le prix doit être un nombre positif' });
        }
        finalPrice = priceNum;
    }

    try {
        const originalPath = req.file.path;
        
        const [result] = await db.query(
            `INSERT INTO artworks (user_id, title, description, category, medium, dimensions, format, image_url, price, is_available) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, title, description || null, category, medium || null, dimensions || null, format || null, originalPath, finalPrice, available]
        );
        
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
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la publication' });
    }
};

// MODIFIER UNE ŒUVRE
exports.updateArtwork = async (req, res) => {
    const { id } = req.params;
    const { title, description, medium, dimensions, price, isAvailable } = req.body;
    const userId = req.user.id;
    
    const available = isAvailable === 'true' || isAvailable === true;
    let finalPrice = null;
    
    if (available && price !== undefined && price !== null && price !== '') {
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            return res.status(400).json({ error: 'Le prix doit être un nombre positif' });
        }
        finalPrice = priceNum;
    }
    
    try {
        const [artworks] = await db.query('SELECT user_id FROM artworks WHERE id = ?', [id]);
        
        if (artworks.length === 0) {
            return res.status(404).json({ error: 'Œuvre non trouvée' });
        }
        
        if (artworks[0].user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorisé' });
        }
        
        await db.query(
            `UPDATE artworks 
             SET title = ?, description = ?, medium = ?, dimensions = ?, price = ?, is_available = ?
             WHERE id = ?`,
            [title, description, medium, dimensions, finalPrice, available, id]
        );
        
        res.json({ message: 'Œuvre mise à jour' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
};

// SUPPRIMER UNE ŒUVRE
exports.deleteArtwork = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    try {
        const [artworks] = await db.query('SELECT user_id, image_url FROM artworks WHERE id = ?', [id]);
        
        if (artworks.length === 0) {
            return res.status(404).json({ error: 'Œuvre non trouvée' });
        }
        
        if (artworks[0].user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorisé' });
        }
        
        if (artworks[0].image_url && fs.existsSync(artworks[0].image_url)) {
            fs.unlinkSync(artworks[0].image_url);
        }
        
        await db.query('DELETE FROM artworks WHERE id = ?', [id]);
        
        res.json({ message: 'Œuvre supprimée' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
};