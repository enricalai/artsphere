const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Accès non autorisé. Token manquant.' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log('🔐 Utilisateur authentifié:', req.user); // Debug
        next();
    } catch (error) {
        console.error('❌ Erreur token:', error);
        res.status(401).json({ error: 'Token invalide ou expiré.' });
    }
};

module.exports = authMiddleware;