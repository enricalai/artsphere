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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [artworkToDelete, setArtworkToDelete] = useState(null);
    const [toast, setToast] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user?.id) {
            loadMyArtworks(1);
        }
    }, [user]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadMyArtworks = async (page = 1) => {
        setLoading(true);
        try {
            const response = await getArtworks(page);
            const myArtworks = response.data.data.filter(a => a.user_id === user?.id);
            setArtworks(myArtworks);
            setPagination({
                page: response.data.pagination.page,
                totalPages: response.data.pagination.pages,
                total: response.data.pagination.total
            });
        } catch (err) {
            console.error('Erreur chargement œuvres:', err);
            showToast('Erreur lors du chargement', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        loadMyArtworks(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (artwork) => {
        setArtworkToDelete(artwork);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (artworkToDelete) {
            try {
                await deleteArtwork(artworkToDelete.id);
                showToast('Œuvre supprimée avec succès', 'success');
                loadMyArtworks(1);
            } catch (err) {
                console.error('Erreur lors de la suppression:', err);
                showToast('Erreur lors de la suppression', 'error');
            } finally {
                setShowDeleteModal(false);
                setArtworkToDelete(null);
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

    const filteredArtworks = activeFilter === 'all' ? artworks : artworks.filter(a => a.category === activeFilter);
    const counts = {
        all: artworks.length,
        traditionnel: artworks.filter(a => a.category === 'traditionnel').length,
        photographie: artworks.filter(a => a.category === 'photographie').length,
        numerique: artworks.filter(a => a.category === 'numerique').length
    };

    if (loading) {
        return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-anthracite/60">Chargement de vos œuvres...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-sm shadow-lg text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                    {toast.message}
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="font-serif text-3xl text-anthracite">Mes œuvres</h1>
                    <p className="font-sans text-anthracite/60 mt-1">Gérez vos créations et leur disponibilité</p>
                </div>
                <Link to="/upload-artwork" className="bg-prusse text-creme px-6 py-2 text-sm hover:bg-prusse/90 transition-colors rounded-full">+ Publier une œuvre</Link>
            </div>

            <div className="flex flex-wrap gap-3 mb-8 border-b pb-4">
                {['all', 'traditionnel', 'photographie', 'numerique'].map(cat => (
                    <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-4 py-2 text-sm rounded-full ${activeFilter === cat ? 'bg-prusse text-creme' : 'bg-anthracite/5 hover:bg-anthracite/10'}`}>
                        {cat === 'all' && `Toutes (${counts.all})`}
                        {cat === 'traditionnel' && `🖌️ Traditionnel (${counts.traditionnel})`}
                        {cat === 'photographie' && `📷 Photographie (${counts.photographie})`}
                        {cat === 'numerique' && `💻 Numérique (${counts.numerique})`}
                    </button>
                ))}
            </div>

            {filteredArtworks.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-anthracite/60">{activeFilter === 'all' ? "Vous n'avez pas encore publié d'œuvres." : `Aucune œuvre dans ${getCategoryLabel(activeFilter)}.`}</p>
                    {activeFilter === 'all' && <Link to="/upload-artwork" className="text-prusse hover:underline mt-2 inline-block">Publier ma première œuvre →</Link>}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredArtworks.map((artwork) => (
                            <div key={artwork.id} className="group border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                <Link to={`/artwork/${artwork.id}`}>
                                    <div className="aspect-square bg-creme overflow-hidden">
                                        <img src={fixImageUrl(artwork.image_url)} alt={artwork.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                                    </div>
                                </Link>
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm">{getCategoryIcon(artwork.category)}</span>
                                            <span className="text-xs text-anthracite/50">{getCategoryLabel(artwork.category)}</span>
                                        </div>
                                        {artwork.format && <span className="text-xs text-anthracite/50 bg-anthracite/5 px-2 py-0.5 rounded">{artwork.format}</span>}
                                    </div>
                                    <Link to={`/artwork/${artwork.id}`}><h3 className="font-serif text-lg hover:text-prusse">{artwork.title}</h3></Link>
                                    <p className="text-sm text-anthracite/60 mt-1">{artwork.medium || 'Médium non spécifié'}</p>
                                    {artwork.price && <p className="text-prusse font-semibold mt-2">{artwork.price} €</p>}
                                    <div className="flex gap-2 mt-2">
                                        {!artwork.is_available && <span className="text-xs text-anthracite/50 italic">Non disponible</span>}
                                        {artwork.is_sold && <span className="text-xs text-green-600 font-semibold">✓ Vendu</span>}
                                        {artwork.is_available && !artwork.is_sold && <span className="text-xs text-green-600">Disponible</span>}
                                    </div>
                                </div>
                                <div className="flex border-t">
                                    <Link to={`/edit-artwork/${artwork.id}`} className="flex-1 text-center py-2 text-sm hover:text-prusse hover:bg-anthracite/5">✏️ Modifier</Link>
                                    <button onClick={() => handleDeleteClick(artwork)} className="flex-1 text-center py-2 text-sm hover:text-red-500 hover:bg-anthracite/5 border-l">🗑️ Supprimer</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {pagination.totalPages > 1 && <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />}
                </>
            )}

            {/* MODALE SUPPRESSION */}
            {showDeleteModal && artworkToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white max-w-md mx-4 p-6 rounded-sm shadow-xl">
                        <h3 className="font-serif text-xl mb-4">🗑️ Supprimer l'œuvre</h3>
                        <p className="text-anthracite/70 mb-4">Êtes-vous sûr de vouloir supprimer "<strong>{artworkToDelete.title}</strong>" ?</p>
                        <p className="text-red-600 text-sm mb-6">Cette action est irréversible.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-anthracite/60 hover:text-anthracite">Annuler</button>
                            <button onClick={handleConfirmDelete} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Oui, supprimer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyArtworks;