import React, { useState, useEffect } from 'react';
import { getArtworks, deleteArtwork } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Pagination from '../components/ui/Pagination';
import { fixImageUrl } from '../utils/imageUtils';

function MyArtworks() {
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const { user } = useAuth();

    useEffect(() => {
        if (user?.id) {
            loadMyArtworks(1);
        }
    }, [user]);

    const loadMyArtworks = async (page = 1) => {
        setLoading(true);
        try {
            // Récupérer toutes les œuvres avec pagination
            const response = await getArtworks(page);
            // Filtrer pour ne garder que celles de l'utilisateur connecté
            const myArtworks = response.data.data.filter(a => a.user_id === user?.id);
            setArtworks(myArtworks);
            setPagination({
                page: response.data.pagination.page,
                totalPages: response.data.pagination.pages,
                total: response.data.pagination.total
            });
        } catch (err) {
            console.error('Erreur chargement œuvres:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        loadMyArtworks(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (artworkId) => {
        if (window.confirm('Supprimer cette œuvre ? Cette action est irréversible.')) {
            try {
                await deleteArtwork(artworkId);
                loadMyArtworks(1);
            } catch (err) {
                console.error('Erreur lors de la suppression:', err);
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

    // Filtrer les œuvres par catégorie
    const filteredArtworks = activeFilter === 'all'
        ? artworks
        : artworks.filter(a => a.category === activeFilter);

    const counts = {
        all: artworks.length,
        traditionnel: artworks.filter(a => a.category === 'traditionnel').length,
        photographie: artworks.filter(a => a.category === 'photographie').length,
        numerique: artworks.filter(a => a.category === 'numerique').length
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="text-center text-anthracite/60">Chargement de vos œuvres...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="font-serif text-3xl text-anthracite">Mes œuvres</h1>
                    <p className="font-sans text-anthracite/60 mt-1">
                        Gérez vos créations et leur disponibilité
                    </p>
                </div>
                <Link 
                    to="/upload-artwork" 
                    className="bg-prusse text-creme px-6 py-2 font-sans text-sm tracking-wide hover:bg-prusse/90 transition-colors rounded-full"
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

            {/* Grille des œuvres */}
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
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredArtworks.map((artwork) => (
                            <div key={artwork.id} className="group border border-anthracite/10 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
                                <Link to={`/artwork/${artwork.id}`}>
                                    <div className="aspect-square bg-creme overflow-hidden">
                                        <img
                                            src={fixImageUrl(artwork.image_url)}
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
                                    <div className="flex gap-2 mt-2">
                                        {!artwork.is_available && (
                                            <span className="text-xs text-anthracite/50 italic">
                                                Non disponible
                                            </span>
                                        )}
                                        {artwork.is_sold && (
                                            <span className="text-xs text-green-600 font-semibold">
                                                ✓ Vendu
                                            </span>
                                        )}
                                        {artwork.is_available && !artwork.is_sold && (
                                            <span className="text-xs text-green-600">
                                                Disponible
                                            </span>
                                        )}
                                    </div>
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
                    
                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="mt-12">
                            <Pagination
                                currentPage={pagination.page}
                                totalPages={pagination.totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default MyArtworks;