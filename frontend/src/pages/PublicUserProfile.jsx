import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicUserProfile, createReport } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import { fixImageUrl } from '../utils/imageUtils';

function PublicUserProfile() {
    const { id } = useParams();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reporting, setReporting] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadProfile();
    }, [id]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadProfile = async () => {
        try {
            const res = await getPublicUserProfile(id);
            setProfile(res.data.user);
            setArtworks(res.data.artworks);
        } catch (err) {
            console.error(err);
            setError('Utilisateur non trouvé');
        } finally {
            setLoading(false);
        }
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        if (!reportReason.trim()) return;

        setReporting(true);
        try {
            await createReport({
                targetUserId: parseInt(id),
                reason: reportReason
            });
            setShowReportModal(false);
            setReportReason('');
            showToast('Signalement envoyé. Merci pour votre vigilance.', 'success');
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.error || 'Erreur lors du signalement', 'error');
        } finally {
            setReporting(false);
        }
    };

    const isOwnProfile = user?.id === parseInt(id);

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
                <p className="text-red-500">{error || 'Profil non trouvé'}</p>
                <Link to="/gallery" className="text-prusse hover:underline mt-4 inline-block">
                    ← Retour à la galerie
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Toast notification */}
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-sm shadow-lg text-white ${
                    toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
                }`}>
                    {toast.message}
                </div>
            )}

            {/* Bouton retour */}
            <Link to="/gallery" className="text-prusse hover:underline mb-6 inline-block">
                ← Retour à la galerie
            </Link>

            {/* Section Profil */}
            <div className="bg-white border border-anthracite/10 p-6 mb-8 rounded-lg">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Photo de profil */}
                    <div className="flex-shrink-0">
                        <Avatar src={profile.avatar_url} alt={profile.nom} size="xl" className="w-32 h-32 md:w-40 md:h-40" />
                    </div>

                    {/* Informations + Bouton signalement */}
                    <div className="flex-1">
                        <div className="flex justify-between items-start flex-wrap gap-4">
                            <div>
                                <h1 className="font-serif text-3xl text-anthracite mb-2">{profile.nom}</h1>
                                <p className="text-anthracite/60 mb-1">{profile.email}</p>
                                {(profile.ville || profile.pays) && (
                                    <p className="text-sm text-anthracite/50">
                                        📍 {[profile.ville, profile.pays].filter(Boolean).join(', ')}
                                    </p>
                                )}
                                <p className="text-xs text-anthracite/40 mt-2">
                                    Membre depuis {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                                </p>
                            </div>

                            {/* Bouton Signaler (uniquement si connecté et pas son propre profil) */}
                            {user && !isOwnProfile && (
                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className="bg-amber-500 text-white px-4 py-2 text-sm rounded hover:bg-amber-600 transition"
                                >
                                    ⚠️ Signaler ce compte
                                </button>
                            )}
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <div className="mt-4 pt-4 border-t border-anthracite/10">
                                <h2 className="font-serif text-lg text-anthracite mb-2">À propos</h2>
                                <p className="text-anthracite/70 whitespace-pre-wrap">{profile.bio}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Œuvres de l'artiste */}
            <h2 className="font-serif text-2xl text-anthracite mb-4">
                Œuvres de {profile.nom} ({artworks.length})
            </h2>

            {artworks.length === 0 ? (
                <p className="text-center text-anthracite/50 py-8">
                    Cet artiste n'a pas encore publié d'œuvres.
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {artworks.map((artwork) => (
                        <Link key={artwork.id} to={`/artwork/${artwork.id}`} className="group border border-anthracite/10 overflow-hidden hover:shadow-lg transition rounded-lg">
                            <div className="aspect-square overflow-hidden bg-anthracite/5">
                                <img
                                    src={fixImageUrl(artwork.image_url)}
                                    alt={artwork.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                            </div>
                            <div className="p-4">
                                <h3 className="font-serif text-lg text-anthracite mb-1">{artwork.title}</h3>
                                <p className="text-sm text-anthracite/60 mb-2">
                                    {artwork.category} {artwork.format && `• ${artwork.format}`}
                                </p>
                                {artwork.price && (
                                    <p className="text-prusse font-semibold">{artwork.price} €</p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Modal de signalement */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl">
                        <h3 className="font-serif text-xl text-anthracite mb-4">⚠️ Signaler ce compte</h3>
                        <form onSubmit={handleReportSubmit}>
                            <textarea
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="Décrivez la raison de votre signalement (comportement inapproprié, spam, etc.)..."
                                className="w-full px-4 py-2 border border-anthracite/20 focus:border-prusse outline-none min-h-[120px] mb-4 rounded-sm"
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
                                    className="bg-amber-500 text-white px-4 py-2 hover:bg-amber-600 disabled:opacity-50 rounded"
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