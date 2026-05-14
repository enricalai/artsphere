import React, { useState, useEffect } from 'react';
import { getArtworks } from '../services/api';
import { Link } from 'react-router-dom';
import Pagination from '../components/ui/Pagination';
import { fixImageUrl } from '../utils/imageUtils';

function Gallery() {
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    useEffect(() => {
        loadArtworks(1);
    }, []);

    const loadArtworks = async (page = 1) => {
        setLoading(true);
        try {
            const response = await getArtworks(page);
            setArtworks(response.data.data);
            setPagination({
                page: response.data.pagination.page,
                totalPages: response.data.pagination.totalPages,
                total: response.data.pagination.total
            });
        } catch (err) {
            console.error(err);
            setError('Impossible de charger les œuvres');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        loadArtworks(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Filtrage local (recherche + catégorie)
    const filteredArtworks = artworks.filter((a) => {
        if (activeCategory !== 'all' && a.category !== activeCategory) return false;
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
            a.title?.toLowerCase().includes(term) ||
            a.artist_name?.toLowerCase().includes(term)
        );
    });

    if (loading) {
        return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-anthracite/60">Chargement...</div>;
    }

    if (error) {
        return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl md:text-4xl text-anthracite">Galerie</h1>
                <p className="font-sans text-anthracite/60 mt-2">Découvrez les œuvres de nos artistes</p>
            </div>

            {/* Barre de recherche */}
            <div className="max-w-md mx-auto mb-6">
                <input
                    type="text"
                    placeholder="Rechercher par titre ou artiste..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-anthracite/20 focus:border-prusse outline-none bg-transparent rounded-full text-center"
                />
            </div>

            {/* Filtres catégorie */}
            <div className="flex justify-center gap-3 mb-8 flex-wrap">
                {['all', 'traditionnel', 'photographie', 'numerique'].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-5 py-2 font-sans text-sm transition-colors rounded-full ${
                            activeCategory === cat
                                ? 'bg-prusse text-creme'
                                : 'bg-transparent border border-anthracite/20 text-anthracite/70 hover:border-prusse hover:text-prusse'
                        }`}
                    >
                        {cat === 'all' && 'Toutes'}
                        {cat === 'traditionnel' && '🖌️ Traditionnel'}
                        {cat === 'photographie' && '📷 Photographie'}
                        {cat === 'numerique' && '💻 Numérique'}
                    </button>
                ))}
            </div>

            {/* Résultats */}
            {filteredArtworks.length === 0 ? (
                <p className="text-center text-anthracite/60 py-12">Aucune œuvre trouvée.</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredArtworks.map((artwork) => (
                            <Link key={artwork.id} to={`/artwork/${artwork.id}`} className="group">
                                <div className="bg-creme overflow-hidden border border-anthracite/5 rounded-lg transition-all duration-300 hover:translate-y-[-4px]">
                                    <img
                                        src={fixImageUrl(artwork.image_url)}
                                        alt={artwork.title}
                                        className="w-full h-64 object-cover transition-opacity duration-500 group-hover:opacity-95"
                                    />
                                </div>
                                <div className="mt-3 text-center">
                                    <h3 className="text-anthracite text-lg font-serif">{artwork.title}</h3>
                                    <p className="text-anthracite/60 text-sm font-sans mt-1">{artwork.artist_name}</p>
                                    {artwork.price && (
                                        <p className="text-prusse text-sm font-sans mt-2">{artwork.price} €</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                    {pagination.totalPages > 1 && (
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default Gallery;