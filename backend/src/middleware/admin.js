// Middleware pour vérifier que l'utilisateur est administrateur
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé. Droits administrateur requis.' });
    }
    
    next();
};

module.exports = adminMiddleware;