import React, { useState, useEffect } from 'react';
import { getArtworks, searchUsersPublic } from '../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import { fixImageUrl } from '../utils/imageUtils';

function Gallery() {
    const { user } = useAuth();
    const [artworks, setArtworks] = useState([]); // ← déjà un tableau vide
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResultsUsers, setSearchResultsUsers] = useState([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        loadArtworks();
    }, []);

    // Recherche d'artistes
    useEffect(() => {
        const searchUsers = async () => {
            if (user && searchTerm.trim().length >= 2) {
                setSearching(true);
                try {
                    const res = await searchUsersPublic(searchTerm);
                    setSearchResultsUsers(res.data || []);
                } catch (err) {
                    console.error(err);
                    setSearchResultsUsers([]);
                } finally {
                    setSearching(false);
                }
            } else {
                setSearchResultsUsers([]);
                setSearching(false);
            }
        };
        searchUsers();
    }, [searchTerm, user]);

    const loadArtworks = async () => {
        setLoading(true);
        try {
            const response = await getArtworks();
            console.log('📦 Réponse API:', response);
            
            // Gérer les deux structures possibles
            let artworksData = [];
            if (response.data && Array.isArray(response.data)) {
                artworksData = response.data;
            } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                artworksData = response.data.data;
            } else if (response.data && typeof response.data === 'object') {
                // Si c'est un objet, on tente de le convertir en tableau
                artworksData = Object.values(response.data).filter(item => typeof item === 'object');
            }
            
            console.log('📦 Œuvres extraites:', artworksData);
            setArtworks(artworksData);
        } catch (err) {
            console.error('❌ Erreur chargement œuvres:', err);
            setError('Impossible de charger les œuvres');
            setArtworks([]); // ← important : mettre un tableau vide en cas d'erreur
        } finally {
            setLoading(false);
        }
    };

    // Filtrage des œuvres par catégorie (avec protection contre undefined)
    const filteredArtworks = Array.isArray(artworks) 
        ? artworks.filter((a) => {
            if (activeCategory !== 'all' && a.category !== activeCategory) return false;
            return true;
        })
        : [];

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="text-center text-anthracite/60">Chargement des œuvres...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="text-center text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl md:text-4xl text-anthracite">Galerie</h1>
                <p className="font-sans text-anthracite/60 mt-2">Découvrez les œuvres de nos artistes</p>
            </div>

            {/* Barre de recherche : UNIQUEMENT si connecté */}
            {user && (
                <div className="max-w-md mx-auto mb-6">
                    <input
                        type="text"
                        placeholder="Rechercher un artiste par nom, email ou ville..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-anthracite/20 focus:border-prusse outline-none bg-transparent rounded-full text-center"
                    />
                </div>
            )}

            {/* Résultats de recherche d'artistes */}
            {user && searchResultsUsers.length > 0 && (
                <div className="mb-8">
                    <h2 className="font-serif text-xl text-anthracite mb-3">
                        Artistes trouvés ({searchResultsUsers.length})
                    </h2>
                    <div className="space-y-3">
                        {searchResultsUsers.map((artist) => (
                            <Link
                                key={artist.id}
                                to={`/user/${artist.id}`}
                                className="flex items-center gap-4 p-3 border border-anthracite/10 hover:bg-anthracite/5 transition rounded-lg"
                            >
                                <Avatar src={artist.avatar_url} alt={artist.nom} size="md" />
                                <div>
                                    <p className="font-serif text-lg text-anthracite font-semibold">
                                        {artist.nom}
                                    </p>
                                    <p className="text-sm text-anthracite/60">{artist.email}</p>
                                    {(artist.ville || artist.pays) && (
                                        <p className="text-xs text-anthracite/50">
                                            📍 {[artist.ville, artist.pays].filter(Boolean).join(', ')}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Filtres par catégorie */}
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

            {/* Grille des œuvres */}
            {!Array.isArray(filteredArtworks) || filteredArtworks.length === 0 ? (
                <p className="text-center text-anthracite/60 py-12">Aucune œuvre trouvée.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredArtworks.map((artwork) => (
                        <Link key={artwork.id} to={`/artwork/${artwork.id}`} className="group">
                            <div className="bg-creme overflow-hidden border border-anthracite/5 rounded-lg transition-all duration-300 hover:translate-y-[-4px]">
                                <img
                                    src={fixImageUrl(artwork.image_url)}
                                    alt={artwork.title}
                                    className="w-full h-64 object-cover transition-opacity duration-500 group-hover:opacity-95"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/400x400?text=Image+non+disponible';
                                    }}
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
            )}
        </div>
    );
}

export default Gallery;