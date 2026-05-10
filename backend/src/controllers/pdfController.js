const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Générer un certificat d'authenticité
exports.generateCertificate = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;

    console.log('========================================');
    console.log(`📄 Génération certificat - OrderId: ${orderId}`);
    console.log(`👤 Utilisateur ID: ${userId}`);
    console.log('========================================');

    try {
        // Requête SQL simplifiée
        const [orders] = await db.query(
            `SELECT 
                o.*,
                a.title as artwork_title,
                a.description,
                a.medium,
                a.dimensions,
                a.price,
                a.image_url,
                buyer.nom as buyer_name,
                buyer.email as buyer_email,
                artist.nom as artist_name
             FROM orders o
             JOIN artworks a ON o.artwork_id = a.id
             JOIN users buyer ON o.buyer_id = buyer.id
             JOIN users artist ON a.user_id = artist.id
             WHERE o.id = ?`,
            [orderId]
        );

        console.log(`📊 Résultat: ${orders.length} commande(s)`);

        if (orders.length === 0) {
            console.log('❌ Commande non trouvée');
            return res.status(404).json({ error: 'Commande non trouvée' });
        }

        const order = orders[0];
        
        // Vérification simplifiée des droits
        if (order.buyer_id !== userId) {
            console.log(`❌ Non autorisé - Buyer: ${order.buyer_id}, User: ${userId}`);
            return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à voir ce certificat' });
        }

        console.log(`✅ Commande trouvée: ${order.artwork_title}`);
        console.log(`📊 Statut: ${order.status}`);

        // Vérifier le statut
        if (order.status !== 'confirmed') {
            console.log(`❌ Statut incorrect: ${order.status}`);
            return res.status(400).json({ error: `Le certificat n'est disponible que pour les commandes confirmées (statut actuel: ${order.status})` });
        }

        // Création du PDF
        console.log('📝 Création du PDF...');
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=certificat_${orderId}.pdf`);
        
        doc.pipe(res);

        // Contenu du PDF
        doc.fontSize(20)
           .text('CERTIFICAT D\'AUTHENTICITÉ', { align: 'center' });
        
        doc.moveDown();
        doc.fontSize(12)
           .text(`N° de certificat: ${orderId.toString().padStart(6, '0')}`, { align: 'center' });
        
        doc.moveDown(2);
        
        // Image (si disponible)
        if (order.image_url) {
            let imagePath = order.image_url;
            // Nettoyer le chemin
            if (imagePath.startsWith('/')) {
                imagePath = imagePath.substring(1);
            }
            
            const fullPath = path.join(__dirname, '../../', imagePath);
            console.log(`🖼️ Chemin image: ${fullPath}`);
            
            if (fs.existsSync(fullPath)) {
                try {
                    doc.image(fullPath, {
                        fit: [300, 300],
                        align: 'center'
                    });
                    doc.moveDown();
                    console.log('✅ Image ajoutée');
                } catch (err) {
                    console.log('⚠️ Erreur image:', err.message);
                    doc.text('Image non disponible', { align: 'center' });
                    doc.moveDown();
                }
            } else {
                console.log('⚠️ Fichier image non trouvé');
                doc.text('Image non disponible', { align: 'center' });
                doc.moveDown();
            }
        }
        
        // Informations
        doc.fontSize(14)
           .text(order.artwork_title, { align: 'center' });
        
        doc.moveDown();
        doc.fontSize(11);
        
        doc.text(`Artiste: ${order.artist_name}`, { align: 'center' });
        doc.text(`Médium: ${order.medium || 'Non spécifié'}`, { align: 'center' });
        doc.text(`Dimensions: ${order.dimensions || 'Non spécifiées'}`, { align: 'center' });
        doc.text(`Prix: ${order.price} €`, { align: 'center' });
        
        doc.moveDown();
        doc.text(`Acquis par: ${order.buyer_name}`, { align: 'center' });
        doc.text(`Date d'achat: ${new Date(order.order_date).toLocaleDateString('fr-FR')}`, { align: 'center' });
        
        doc.moveDown(2);
        
        // Signatures
        doc.fontSize(10)
           .text('Signature de l\'artiste', 100, doc.y, { align: 'center' })
           .text('Cachet ArtSphere', doc.page.width - 150, doc.y, { align: 'center' });
        
        doc.moveDown();
        doc.text('__________________', 100, doc.y, { align: 'center' })
           .text('__________________', doc.page.width - 150, doc.y, { align: 'center' });
        
        doc.end();
        
        console.log('✅ PDF généré avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        console.error('❌ Stack:', error.stack);
        
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Erreur lors de la génération du PDF',
                message: error.message
            });
        }
    }
};

// Fonction de test
exports.testCertificate = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    console.log(`🧪 TEST - OrderId: ${orderId}, UserId: ${userId}`);
    
    try {
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE id = ? AND buyer_id = ?',
            [orderId, userId]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        
        const doc = new PDFDocument();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=test_${orderId}.pdf`);
        
        doc.pipe(res);
        doc.fontSize(20).text('TEST RÉUSSI !', { align: 'center' });
        doc.fontSize(12).text(`Commande N°: ${orderId}`, { align: 'center' });
        doc.text(`Statut: ${orders[0].status}`, { align: 'center' });
        doc.end();
        
        console.log('✅ PDF test généré');
        
    } catch (error) {
        console.error('❌ Erreur test:', error);
        res.status(500).json({ error: error.message });
    }
};