import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArtworkById, addLike, removeLike, checkLike, buyArtwork, deleteArtwork } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import CommentSection from '../components/CommentSection';
import { fixImageUrl } from '../utils/imageUtils';

function ArtworkDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [artwork, setArtwork] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showBuyConfirm, setShowBuyConfirm] = useState(false);
    const [buying, setBuying] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadArtwork();
    }, [id]);

    useEffect(() => {
        if (user && artwork) {
            checkIfLiked();
        }
    }, [user, artwork]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadArtwork = async () => {
        try {
            const response = await getArtworkById(id);
            setArtwork(response.data);
            setLikesCount(response.data.likes_count || 0);
        } catch (err) {
            setError('Œuvre non trouvée');
        } finally {
            setLoading(false);
        }
    };

    const checkIfLiked = async () => {
        try {
            const response = await checkLike(id);
            setLiked(response.data.liked);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLike = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            if (liked) {
                const response = await removeLike(id);
                setLiked(false);
                setLikesCount(response.data.likes_count);
            } else {
                const response = await addLike(id);
                setLiked(true);
                setLikesCount(response.data.likes_count);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleBuyClick = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setShowBuyConfirm(true);
    };

    const handleConfirmBuy = async () => {
        setBuying(true);
        try {
            await buyArtwork(id);
            setShowBuyConfirm(false);
            showToast('Commande créée avec succès ! L\'artiste va confirmer la vente.', 'success');
            loadArtwork();
        } catch (err) {
            showToast(err.response?.data?.error || 'Erreur lors de l\'achat', 'error');
        } finally {
            setBuying(false);
        }
    };

    const handleEdit = () => {
        navigate(`/edit-artwork/${id}`);
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            await deleteArtwork(id);
            navigate('/my-artworks');
        } catch (err) {
            console.error(err);
            showToast('Erreur lors de la suppression', 'error');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const isOwner = user?.id === artwork?.user_id;

    const getCategoryIcon = () => {
        switch (artwork?.category) {
            case 'traditionnel': return '🖌️';
            case 'photographie': return '📷';
            case 'numerique': return '💻';
            default: return '🎨';
        }
    };

    if (loading) {
        return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-anthracite/60">Chargement...</div>;
    }

    if (error || !artwork) {
        return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-red-500">{error || 'Œuvre non trouvée'}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-sm shadow-lg text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                    {toast.message}
                </div>
            )}

            {isOwner && (
                <div className="flex justify-end gap-3 mb-6">
                    <button onClick={handleEdit} className="bg-prusse text-white px-4 py-2 text-sm rounded hover:bg-prusse/80">✏️ Modifier</button>
                    <button onClick={handleDeleteClick} className="bg-red-500 text-white px-4 py-2 text-sm rounded hover:bg-red-600">🗑️ Supprimer</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                    <div className="bg-creme overflow-hidden border border-anthracite/5 rounded-sm">
                        <img src={fixImageUrl(artwork.image_url)} alt={artwork.title} className="w-full h-auto object-cover" />
                    </div>

                    {artwork.is_available && artwork.price && !artwork.is_sold && user?.id !== artwork.user_id && (
                        <div className="mt-6">
                            <Button variant="primary" className="w-full" onClick={handleBuyClick}>Acheter {artwork.price} €</Button>
                        </div>
                    )}
                    {!artwork.is_available && (
                        <div className="mt-6 p-3 bg-anthracite/5 text-center rounded-sm">
                            <p className="text-sm text-anthracite/50">Cette œuvre n'est pas disponible à la vente</p>
                        </div>
                    )}
                    {artwork.is_sold && (
                        <div className="mt-6 p-3 bg-green-50 text-center rounded-sm">
                            <p className="text-sm text-green-600">✓ Cette œuvre a été vendue</p>
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{getCategoryIcon()}</span>
                        <span className="text-sm text-anthracite/50">{artwork.category}</span>
                    </div>
                    <h1 className="font-serif text-3xl md:text-4xl text-anthracite">{artwork.title}</h1>
                    <p className="text-anthracite/60 mt-2">Par {artwork.artist_name}</p>

                    <div className="mt-6 border-t border-anthracite/10 pt-6">
                        <h2 className="font-serif text-xl text-anthracite mb-3">Cartel technique</h2>
                        <div className="space-y-2 text-sm">
                            {artwork.medium && <p><span className="text-anthracite/60">Médium :</span> {artwork.medium}</p>}
                            {artwork.dimensions && <p><span className="text-anthracite/60">Dimensions :</span> {artwork.dimensions}</p>}
                            {artwork.format && <p><span className="text-anthracite/60">Format :</span> {artwork.format}</p>}
                            {artwork.price && <p><span className="text-anthracite/60">Prix :</span> <span className="text-prusse font-medium">{artwork.price} €</span></p>}
                        </div>
                    </div>

                    {artwork.description && (
                        <div className="mt-6 border-t border-anthracite/10 pt-6">
                            <h2 className="font-serif text-xl text-anthracite mb-3">Description</h2>
                            <p className="text-anthracite/80 leading-relaxed">{artwork.description}</p>
                        </div>
                    )}

                    <div className="mt-6 border-t border-anthracite/10 pt-6 flex items-center gap-4">
                        <button onClick={handleLike} className={`text-sm tracking-wide transition-colors ${liked ? 'text-prusse' : 'text-anthracite/60 hover:text-prusse'}`}>
                            {liked ? '❤️ J\'aime' : '♡ J\'aime'}
                        </button>
                        <span className="text-sm text-anthracite/60">{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
                    </div>
                </div>
            </div>

            <CommentSection artworkId={id} />

            {showBuyConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl">
                        <h3 className="font-serif text-xl text-anthracite mb-4">Confirmer l'achat</h3>
                        <p className="mb-2">Vous êtes sur le point d'acheter :</p>
                        <p className="font-serif text-lg mb-4">{artwork.title} - {artwork.price} €</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowBuyConfirm(false)} className="px-4 py-2 text-anthracite/60 hover:text-anthracite">Annuler</button>
                            <button onClick={handleConfirmBuy} disabled={buying} className="bg-prusse text-white px-4 py-2 rounded hover:bg-prusse/80">
                                {buying ? 'Achat...' : 'Confirmer l\'achat'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl">
                        <h3 className="font-serif text-xl text-anthracite mb-4">🗑️ Supprimer l'œuvre</h3>
                        <p className="mb-4">Êtes-vous sûr de vouloir supprimer cette œuvre ?</p>
                        <p className="mb-6 font-semibold">Cette action est irréversible.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-anthracite/60 hover:text-anthracite">Annuler</button>
                            <button onClick={handleConfirmDelete} disabled={deleting} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                                {deleting ? 'Suppression...' : 'Oui, supprimer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ArtworkDetail;