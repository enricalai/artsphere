require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Import des routes
const authRoutes = require('./src/routes/authRoutes');
const artworkRoutes = require('./src/routes/artworkRoutes');
const likeRoutes = require('./src/routes/likeRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const pdfRoutes = require('./src/routes/pdfRoutes');
const publicUserRoutes = require('./src/routes/publicUserRoutes'); // Ajout des routes utilisateurs publiques

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes de test
app.get('/', (req, res) => {
    res.json({ message: '🎨 API ArtSphere est en ligne !' });
});

app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 as test');
        res.json({ success: true, message: 'Connexion BDD OK !' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/public/users', publicUserRoutes); // Routes utilisateurs publiques

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});