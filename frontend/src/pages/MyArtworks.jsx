import React, { useState, useEffect } from 'react';
import { getArtworks, deleteArtwork } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function MyArtworks() {
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const { user } = useAuth();

    useEffect(() => {
        loadMyArtworks();
    }, []);

    const loadMyArtworks = async () => {
        try {
            const response = await getArtworks();
            const myArtworks = response.data.filter(a => a.user_id === user?.id);
            setArtworks(myArtworks);
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

    const getCategoryIcon = (category) => {
        switch(category) {
            case 'traditionnel': return '🖌️';
            case 'photographie': return '📷';
            case 'numerique': return '💻';
            default: return '🎨';
        }
    };

    const getCategoryLabel = (category) => {
        switch(category) {
            case 'traditionnel': return 'Traditionnel';
            case 'photographie': return 'Photographie';
            case 'numerique': return 'Numérique';
            default: return category;
        }
    };

    // Compter les œuvres par catégorie
    const counts = {
        all: artworks.length,
        traditionnel: artworks.filter(a => a.category === 'traditionnel').length,
        photographie: artworks.filter(a => a.category === 'photographie').length,
        numerique: artworks.filter(a => a.category === 'numerique').length
    };

    // Filtrer les œuvres
    const filteredArtworks = activeFilter === 'all'
        ? artworks
        : artworks.filter(a => a.category === activeFilter);

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

            {/* Filtres par catégorie */}
            <div className="flex flex-wrap gap-3 mb-8 border-b border-anthracite/10 pb-4">
                <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-4 py-2 font-sans text-sm transition-colors rounded-full ${
                        activeFilter === 'all'
                            ? 'bg-prusse text-creme'
                            : 'bg-anthracite/5 text-anthracite/70 hover:bg-anthracite/10'
                    }`}
                >
                    Toutes ({counts.all})
                </button>
                <button
                    onClick={() => setActiveFilter('traditionnel')}
                    className={`px-4 py-2 font-sans text-sm transition-colors rounded-full ${
                        activeFilter === 'traditionnel'
                            ? 'bg-prusse text-creme'
                            : 'bg-anthracite/5 text-anthracite/70 hover:bg-anthracite/10'
                    }`}
                >
                    🖌️ Traditionnel ({counts.traditionnel})
                </button>
                <button
                    onClick={() => setActiveFilter('photographie')}
                    className={`px-4 py-2 font-sans text-sm transition-colors rounded-full ${
                        activeFilter === 'photographie'
                            ? 'bg-prusse text-creme'
                            : 'bg-anthracite/5 text-anthracite/70 hover:bg-anthracite/10'
                    }`}
                >
                    📷 Photographie ({counts.photographie})
                </button>
                <button
                    onClick={() => setActiveFilter('numerique')}
                    className={`px-4 py-2 font-sans text-sm transition-colors rounded-full ${
                        activeFilter === 'numerique'
                            ? 'bg-prusse text-creme'
                            : 'bg-anthracite/5 text-anthracite/70 hover:bg-anthracite/10'
                    }`}
                >
                    💻 Numérique ({counts.numerique})
                </button>
            </div>

            {filteredArtworks.length === 0 ? (
                <div className="text-center py-12">
                    <p className="font-sans text-anthracite/60">
                        {activeFilter === 'all' 
                            ? "Vous n'avez pas encore publié d'œuvres."
                            : `Aucune œuvre dans la catégorie ${getCategoryLabel(activeFilter)}.`
                        }
                    </p>
                    {activeFilter === 'all' && (
                        <Link to="/upload-artwork" className="text-prusse hover:underline font-sans mt-2 inline-block">
                            Publier ma première œuvre →
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredArtworks.map((artwork) => (
                        <div key={artwork.id} className="group border border-anthracite/10 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                            <Link to={`/artwork/${artwork.id}`}>
                                <div className="aspect-square bg-creme overflow-hidden">
                                    <img
                                        src={`http://localhost:5000/${artwork.image_url?.replace(/\\/g, '/')}`}
                                        alt={artwork.title}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/400x400?text=Image+non+disponible';
                                        }}
                                    />
                                </div>
                            </Link>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm">{getCategoryIcon(artwork.category)}</span>
                                        <span className="text-xs text-anthracite/50">{getCategoryLabel(artwork.category)}</span>
                                    </div>
                                    {artwork.format && (
                                        <span className="text-xs text-anthracite/50 bg-anthracite/5 px-2 py-0.5 rounded">
                                            {artwork.format}
                                        </span>
                                    )}
                                </div>
                                <Link to={`/artwork/${artwork.id}`}>
                                    <h3 className="font-serif text-lg text-anthracite hover:text-prusse transition-colors line-clamp-1">
                                        {artwork.title}
                                    </h3>
                                </Link>
                                <p className="font-sans text-sm text-anthracite/60 mt-1 line-clamp-1">
                                    {artwork.medium || 'Médium non spécifié'}
                                </p>
                                {artwork.price && (
                                    <p className="font-sans text-prusse font-semibold mt-2">
                                        {artwork.price} €
                                    </p>
                                )}
                                {!artwork.is_available && (
                                    <p className="font-sans text-xs text-anthracite/50 mt-1 italic">
                                        Non disponible à la vente
                                    </p>
                                )}
                                {artwork.is_sold && (
                                    <p className="font-sans text-xs text-green-600 mt-1">
                                        ✓ Vendu
                                    </p>
                                )}
                            </div>
                            <div className="flex border-t border-anthracite/10">
                                <Link
                                    to={`/edit-artwork/${artwork.id}`}
                                    className="flex-1 text-center py-2 text-sm text-anthracite/60 hover:text-prusse hover:bg-anthracite/5 transition-colors"
                                >
                                    ✏️ Modifier
                                </Link>
                                <button
                                    onClick={() => handleDelete(artwork.id)}
                                    className="flex-1 text-center py-2 text-sm text-anthracite/60 hover:text-red-500 hover:bg-anthracite/5 transition-colors border-l border-anthracite/10"
                                >
                                    🗑️ Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyArtworks;