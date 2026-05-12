import React, { useState, useEffect } from 'react';
import { getArtworks, deleteArtwork } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function MyArtworks() {
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imageErrors, setImageErrors] = useState({});
    const { user } = useAuth();

    useEffect(() => {
        loadMyArtworks();
    }, []);

    const loadMyArtworks = async () => {
        try {
            const response = await getArtworks();
            const myArtworks = response.data.filter(a => a.user_id === user?.id);
            setArtworks(myArtworks);
            // Réinitialiser les erreurs d'image
            setImageErrors({});
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (artworkId) => {
        if (window.confirm('Supprimer cette œuvre ? Cette action est irréversible.')) {
            try {
                await deleteArtwork(artworkId);
                loadMyArtworks();
            } catch (err) {
                console.error(err);
                alert('Erreur lors de la suppression');
            }
        }
    };

    // Fonction pour obtenir l'URL de l'image avec fallback
    const getImageUrl = (artwork) => {
        // Priorité à display_image, sinon image_url
        const imagePath = artwork.display_image || artwork.image_url;
        if (!imagePath) return null;
        
        // Si l'image a déjà une erreur, retourner null pour afficher le placeholder
        if (imageErrors[artwork.id]) {
            return null;
        }
        
        return `http://localhost:5000/${imagePath}`;
    };

    // Gestionnaire d'erreur d'image
    const handleImageError = (artworkId) => {
        setImageErrors(prev => ({
            ...prev,
            [artworkId]: true
        }));
    };

    const getCategoryIcon = (category) => {
        switch(category) {
            case 'traditionnel': return '🖌️';
            case 'photographie': return '📷';
            case 'numerique': return '💻';
            default: return '🎨';
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="text-center text-anthracite/60">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="font-serif text-3xl text-anthracite">Mes œuvres</h1>
                <Link 
                    to="/upload-artwork" 
                    className="bg-prusse text-creme px-6 py-2 font-sans text-sm tracking-wide hover:bg-prusse/90 transition-colors"
                >
                    + Publier une œuvre
                </Link>
            </div>

            {artworks.length === 0 ? (
                <div className="text-center py-12">
                    <p className="font-sans text-anthracite/60">Vous n'avez pas encore publié d'œuvres.</p>
                    <Link to="/upload-artwork" className="text-prusse hover:underline font-sans mt-2 inline-block">
                        Publier ma première œuvre →
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {artworks.map((artwork) => {
                        const imageUrl = getImageUrl(artwork);
                        
                        return (
                            <div key={artwork.id} className="group border border-anthracite/10 p-4 hover:shadow-lg transition-shadow">
                                <Link to={`/artwork/${artwork.id}`}>
                                    <div className="bg-creme overflow-hidden">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={artwork.title}
                                                className="w-full h-48 object-cover transition-opacity duration-500 group-hover:opacity-95"
                                                onError={() => handleImageError(artwork.id)}
                                            />
                                        ) : (
                                            <div className="w-full h-48 bg-anthracite/10 flex items-center justify-center">
                                                <div className="text-center">
                                                    <span className="text-4xl block mb-2">🖼️</span>
                                                    <p className="text-anthracite/50 font-sans text-xs">
                                                        Image non disponible
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-sm">{getCategoryIcon(artwork.category)}</span>
                                            <span className="text-xs text-anthracite/50">{artwork.category}</span>
                                        </div>
                                        <h3 className="font-serif text-lg text-anthracite">{artwork.title}</h3>
                                        <p className="font-sans text-sm text-anthracite/60 mt-1">{artwork.medium || 'Médium non spécifié'}</p>
                                        {artwork.format && (
                                            <p className="font-sans text-xs text-anthracite/50 mt-1">Format: {artwork.format}</p>
                                        )}
                                        {artwork.price && (
                                            <p className="font-sans text-prusse mt-2">{artwork.price} €</p>
                                        )}
                                    </div>
                                </Link>

                                <div className="mt-3 flex flex-col gap-2">
                                    <button
                                        onClick={() => handleDelete(artwork.id)}
                                        className="w-full bg-red-500 text-white px-4 py-2 font-sans text-sm hover:bg-red-600 transition-colors"
                                    >
                                        Supprimer
                                    </button>

                                    <Link
                                        to={`/edit-artwork/${artwork.id}`}
                                        className="w-full bg-prusse text-white px-4 py-2 font-sans text-sm hover:bg-prusse/80 transition-colors text-center"
                                    >
                                        Modifier
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default MyArtworks;