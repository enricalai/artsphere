import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicUserProfile } from '../services/api';
import Avatar from '../components/ui/Avatar';
import { createReport } from '../services/api';
import { fixImageUrl, getAvatarUrl, getArtworkImageUrl } from '../utils/imageUtils';

function PublicUserProfile() {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reporting, setReporting] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [id]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const res = await getPublicUserProfile(id);
            console.log('📦 Données reçues:', res.data);
            console.log('🖼️ Œuvres:', res.data.artworks);
            setProfile(res.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Impossible de charger le profil');
        } finally {
            setLoading(false);
        }
    };

    const handleReport = async (e) => {
        e.preventDefault();
        if (!reportReason.trim()) return;

        setReporting(true);
        try {
            await createReport({
                reported_user_id: parseInt(id),
                reason: reportReason,
                type: 'user'
            });
            setShowReportModal(false);
            setReportReason('');
            alert('Signalement envoyé. Merci pour votre vigilance.');
        } catch (err) {
            console.error(err);
            alert('Erreur lors du signalement');
        } finally {
            setReporting(false);
        }
    };

    // Formatage sécurisé du prix
    const formatPrice = (price) => {
        if (price === null || price === undefined) return 'Prix sur demande';
        return `${price.toLocaleString('fr-FR')} €`;
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-12 text-center">
                <p className="text-anthracite/60">Chargement du profil...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-12 text-center">
                <p className="text-red-600">{error || 'Profil non trouvé'}</p>
                <Link to="/gallery" className="text-prusse hover:underline mt-4 inline-block">
                    ← Retour à la galerie
                </Link>
            </div>
        );
    }

    const { user: artist, artworks } = profile;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Bouton retour vers la galerie */}
            <Link to="/gallery" className="text-prusse hover:underline mb-6 inline-block">
                ← Retour à la galerie
            </Link>

            {/* Section Profil : Photo à gauche, Infos à droite */}
            <div className="bg-white border border-anthracite/10 p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Photo de profil - gauche */}
                    <div className="flex-shrink-0">
                        <Avatar 
                            src={getAvatarUrl(artist.avatar_url, artist.nom)}
                            alt={artist.nom} 
                            size="xl" 
                            className="w-32 h-32 md:w-40 md:h-40"
                        />
                    </div>

                    {/* Informations - droite */}
                    <div className="flex-1">
                        <div className="flex justify-between items-start flex-wrap gap-4">
                            <div>
                                <h1 className="font-serif text-3xl text-anthracite mb-2">{artist.nom}</h1>
                                <p className="text-anthracite/60 mb-1">{artist.email}</p>
                                {(artist.ville || artist.pays) && (
                                    <p className="text-sm text-anthracite/50">
                                        📍 {[artist.ville, artist.pays].filter(Boolean).join(', ')}
                                    </p>
                                )}
                                <p className="text-xs text-anthracite/40 mt-2">
                                    Membre depuis {artist.created_at ? new Date(artist.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                </p>
                            </div>
                            
                            {/* Bouton signaler */}
                            <button
                                onClick={() => setShowReportModal(true)}
                                className="text-red-500 hover:text-red-700 text-sm border border-red-300 px-4 py-2 rounded hover:bg-red-50 transition"
                            >
                                ⚠️ Signaler ce compte
                            </button>
                        </div>

                        {/* Bio */}
                        {artist.bio && (
                            <div className="mt-4 pt-4 border-t border-anthracite/10">
                                <h2 className="font-serif text-lg text-anthracite mb-2">À propos</h2>
                                <p className="text-anthracite/70 whitespace-pre-wrap">{artist.bio}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Section Œuvres */}
            <div>
                <h2 className="font-serif text-2xl text-anthracite mb-4">
                    Œuvres de {artist.nom} ({artworks?.length || 0})
                </h2>
                
                {!artworks || artworks.length === 0 ? (
                    <p className="text-anthracite/50 text-center py-8">
                        Cet artiste n'a pas encore publié d'œuvres.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {artworks.map((artwork) => (
                            <Link 
                                key={artwork.id} 
                                to={`/artwork/${artwork.id}`}
                                className="group border border-anthracite/10 overflow-hidden hover:shadow-lg transition"
                            >
                                <div className="aspect-square overflow-hidden bg-anthracite/5">
                                    <img
                                        src={getArtworkImageUrl(artwork.image_url)}
                                        alt={artwork.title || 'Œuvre'}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        onError={(e) => {
                                            console.error(`Erreur chargement image: ${artwork.image_url}`);
                                            e.target.src = getArtworkImageUrl(null);
                                        }}
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-serif text-lg text-anthracite mb-1">{artwork.title || 'Sans titre'}</h3>
                                    <p className="text-sm text-anthracite/60 mb-2">
                                        {artwork.category || 'Catégorie non spécifiée'} • {artwork.format || 'Format non spécifié'}
                                    </p>
                                    <p className="text-prusse font-semibold">
                                        {formatPrice(artwork.price)}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de signalement */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white max-w-md mx-4 p-6 rounded-lg shadow-xl">
                        <h3 className="font-serif text-xl text-anthracite mb-4">Signaler ce compte</h3>
                        <form onSubmit={handleReport}>
                            <textarea
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="Décrivez la raison de votre signalement..."
                                className="w-full px-4 py-2 border border-anthracite/20 focus:border-prusse outline-none min-h-[120px] mb-4"
                                required
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(false)}
                                    className="px-4 py-2 text-anthracite/60 hover:text-anthracite"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={reporting}
                                    className="bg-red-600 text-white px-4 py-2 hover:bg-red-700 disabled:opacity-50"
                                >
                                    {reporting ? 'Envoi...' : 'Envoyer le signalement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PublicUserProfile;