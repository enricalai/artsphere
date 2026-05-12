// Fonction pour corriger l'URL des images (remplace les backslashes par des slashes)
export const fixImageUrl = (url) => {
    if (!url) return null;
    // Nettoie le chemin (remplace les backslashes par des slashes)
    const cleanPath = url.replace(/\\/g, '/');
    // Si l'URL commence déjà par http, on la retourne telle quelle
    if (cleanPath.startsWith('http')) return cleanPath;
    // Sinon on ajoute le préfixe localhost
    return `http://localhost:5000/${cleanPath}`;
};

// Fonction pour obtenir l'URL de l'avatar avec fallback
export const getAvatarUrl = (avatarPath, name) => {
    if (avatarPath) {
        return fixImageUrl(avatarPath);
    }
    // Fallback: génère une URL avec les initiales
    const initials = name?.charAt(0)?.toUpperCase() || '?';
    return `https://ui-avatars.com/api/?name=${initials}&background=003153&color=fff&bold=true&fontsize=0.33`;
};

// Fonction pour l'image d'œuvre avec fallback
export const getArtworkImageUrl = (imagePath) => {
    const url = fixImageUrl(imagePath);
    return url || 'https://via.placeholder.com/400x400?text=Image+non+disponible';
};