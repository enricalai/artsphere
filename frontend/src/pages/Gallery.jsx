import React, { useState, useEffect } from 'react';
import { getArtworks, searchUsersPublic } from '../services/api';
import { Link } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import { fixImageUrl } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';

function Gallery() {
    const { isAuthenticated } = useAuth();
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResultsUsers, setSearchResultsUsers] = useState([]);
    const [searching, setSearching] = useState(false);

    // Chargement initial des œuvres
    useEffect(() => {
        loadArtworks();
    }, []);

    const loadArtworks = async () => {
        try {
            const response = await getArtworks();
            setArtworks(response.data);
        } catch (err) {
            console.error(err);
            setError('Impossible de charger les œuvres');
        } finally {
            setLoading(false);
        }
    };

    // Recherche utilisateurs (artistes) - uniquement si connecté
    useEffect(() => {
        const searchUsers = async () => {
            if (!isAuthenticated) return;
            
            if (searchTerm.trim().length >= 2) {
                setSearching(true);
                try {
                    const res = await searchUsersPublic(searchTerm);
                    setSearchResultsUsers(res.data);
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
    }, [searchTerm, isAuthenticated]);

    // Filtrage des œuvres par catégorie et par mot-clé
    const categoryFiltered =
        activeCategory === 'all'
            ? artworks
            : artworks.filter((a) => a.category === activeCategory);

    const filteredArtworks = categoryFiltered.filter((a) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
            a.title?.toLowerCase().includes(term) ||
            a.artist_name?.toLowerCase().includes(term)
        );
    });

    const hasSearchResults = searchTerm.trim().length >= 2 && isAuthenticated;
    const showUserResults = searchResultsUsers.length > 0;
    const showArtworkResults = filteredArtworks.length > 0;

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="text-center text-anthracite/60">Chargement...</div>
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
                <h1 className="font-serif text-3xl md:text-4xl text-anthracite">
                    Galerie
                </h1>
                <p className="font-sans text-anthracite/60 mt-2">
                    Découvrez les œuvres et artistes de la communauté
                </p>
            </div>

            {/* 🔍 Barre de recherche - Visible uniquement pour les membres connectés */}
            {isAuthenticated && (
                <div className="max-w-xl mx-auto mb-8">
                    <input
                        type="text"
                        placeholder="Rechercher une œuvre ou un artiste..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-5 py-3 border border-anthracite/20 focus:border-prusse outline-none bg-transparent rounded-full text-center"
                    />
                </div>
            )}

            {/* Résultats de recherche (mixte : artistes + œuvres) */}
            {hasSearchResults && (
                <div className="mb-10">
                    {searching && (
                        <p className="text-center text-anthracite/60 mb-4">
                            Recherche en cours...
                        </p>
                    )}

                    {/* Section Artistes */}
                    {showUserResults && (
                        <div className="mb-8">
                            <h2 className="font-serif text-xl text-anthracite mb-3 pb-1 border-b border-anthracite/10">
                                Artistes trouvés ({searchResultsUsers.length})
                            </h2>
                            <div className="space-y-3">
                                {searchResultsUsers.map((user) => (
                                    <Link
                                        key={user.id}
                                        to={`/user/${user.id}`}
                                        className="flex items-center gap-4 p-3 border border-anthracite/10 hover:bg-anthracite/5 transition rounded-lg"
                                    >
                                        <Avatar src={user.avatar_url} alt={user.nom} size="md" />
                                        <div>
                                            <p className="font-serif text-lg text-anthracite font-semibold">
                                                {user.nom}
                                            </p>
                                            <p className="text-sm text-anthracite/60">{user.email}</p>
                                            {(user.ville || user.pays) && (
                                                <p className="text-xs text-anthracite/50">
                                                    📍 {[user.ville, user.pays].filter(Boolean).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section Œuvres */}
                    {showArtworkResults && (
                        <div>
                            <h2 className="font-serif text-xl text-anthracite mb-3 pb-1 border-b border-anthracite/10">
                                Œuvres trouvées ({filteredArtworks.length})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredArtworks.map((artwork) => (
                                    <Link
                                        key={artwork.id}
                                        to={`/artwork/${artwork.id}`}
                                        className="group border border-anthracite/10 overflow-hidden hover:shadow-md transition"
                                    >
                                        <div className="aspect-square overflow-hidden">
                                            <img
                                                src={fixImageUrl(artwork.image_url)}
                                                alt={artwork.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-serif text-anthracite">
                                                {artwork.title}
                                            </h3>
                                            <p className="text-sm text-anthracite/60">
                                                {artwork.artist_name}
                                            </p>
                                            {artwork.price && (
                                                <p className="text-prusse text-sm font-semibold mt-1">
                                                    {artwork.price} €
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Aucun résultat */}
                    {!searching &&
                        !showUserResults &&
                        !showArtworkResults &&
                        searchTerm.trim().length >= 2 && (
                            <p className="text-center text-anthracite/50 py-8">
                                Aucun résultat trouvé pour "{searchTerm}".
                            </p>
                        )}
                </div>
            )}

            {/* Affichage normal : catégories + toutes les œuvres (si pas de recherche active ou non connecté) */}
            {(!hasSearchResults || !isAuthenticated) && (
                <>
                    {/* Filtres par catégorie */}
                    <div className="flex justify-center gap-3 mb-8 flex-wrap">
                        {['all', 'traditionnel', 'photographie', 'numerique'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-2 font-sans text-sm transition-colors ${
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
                    {filteredArtworks.length === 0 ? (
                        <p className="text-center text-anthracite/60 py-12">
                            Aucune œuvre dans cette catégorie.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredArtworks.map((artwork) => (
                                <Link
                                    key={artwork.id}
                                    to={`/artwork/${artwork.id}`}
                                    className="group"
                                >
                                    <div className="bg-creme overflow-hidden border border-anthracite/5 transition-all duration-300 hover:translate-y-[-4px]">
                                        <img
                                            src={fixImageUrl(artwork.image_url)}
                                            alt={artwork.title}
                                            className="w-full h-64 object-cover transition-opacity duration-500 group-hover:opacity-95"
                                        />
                                    </div>
                                    <div className="mt-3 text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <span className="text-sm">
                                                {artwork.category === 'traditionnel' && '🖌️'}
                                                {artwork.category === 'photographie' && '📷'}
                                                {artwork.category === 'numerique' && '💻'}
                                            </span>
                                            <span className="text-xs text-anthracite/50">
                                                {artwork.category}
                                            </span>
                                        </div>
                                        <h3 className="text-anthracite text-lg font-serif">
                                            {artwork.title}
                                        </h3>
                                        <p className="text-anthracite/60 text-sm font-sans mt-1">
                                            {artwork.artist_name}
                                        </p>
                                        {artwork.format && (
                                            <p className="text-anthracite/50 text-xs font-sans mt-1">
                                                Format: {artwork.format}
                                            </p>
                                        )}
                                        {artwork.price && (
                                            <p className="text-prusse text-sm font-sans mt-2">
                                                {artwork.price} €
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Gallery;