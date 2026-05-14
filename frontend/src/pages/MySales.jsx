import React, { useState, useEffect } from 'react';
import { getMySales, confirmOrder, refuseOrder } from '../services/api';
import { Link } from 'react-router-dom';
import Pagination from '../components/ui/Pagination';
import { fixImageUrl } from '../utils/imageUtils';

function MySales() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRefuseModal, setShowRefuseModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [pagination, setPagination] = useState({ 
        page: 1, 
        totalPages: 1, 
        total: 0,
        hasNext: false,
        hasPrev: false
    });

    useEffect(() => {
        loadSales(1);
    }, []);

    // Fonction pour afficher un toast
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadSales = async (page = 1) => {
        setLoading(true);
        try {
            const response = await getMySales(page, 10);
            
            console.log('📦 Ventes reçues:', response.data);
            
            setSales(response.data.data || []);
            setPagination({
                page: response.data.pagination.page,
                totalPages: response.data.pagination.pages,
                total: response.data.pagination.total,
                hasNext: response.data.pagination.hasNext,
                hasPrev: response.data.pagination.hasPrev
            });
        } catch (err) {
            console.error('❌ Erreur chargement ventes:', err);
            showToast('Erreur lors du chargement des ventes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        loadSales(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'pending': 
                return <span className="bg-yellow-100 text-yellow-600 px-2 py-1 text-xs rounded-full">En attente</span>;
            case 'confirmed': 
                return <span className="bg-green-100 text-green-600 px-2 py-1 text-xs rounded-full">Confirmée</span>;
            case 'cancelled': 
                return <span className="bg-red-100 text-red-600 px-2 py-1 text-xs rounded-full">Annulée</span>;
            case 'refused':
                return <span className="bg-orange-100 text-orange-600 px-2 py-1 text-xs rounded-full">Refusée</span>;
            default: 
                return <span className="bg-gray-100 text-gray-600 px-2 py-1 text-xs rounded-full">{status}</span>;
        }
    };

    // Ouvrir la modal de confirmation
    const handleConfirmClick = (order) => {
        setSelectedOrder(order);
        setShowConfirmModal(true);
    };

    // Ouvrir la modal de refus
    const handleRefuseClick = (order) => {
        setSelectedOrder(order);
        setShowRefuseModal(true);
    };

    // Exécuter la confirmation
    const handleConfirmOrder = async () => {
        if (!selectedOrder) return;
        
        setActionLoading(true);
        try {
            await confirmOrder(selectedOrder.id);
            setShowConfirmModal(false);
            setSelectedOrder(null);
            await loadSales(pagination.page);
            showToast('Vente confirmée avec succès', 'success');
        } catch (err) {
            console.error('❌ Erreur confirmation:', err);
            showToast(err.response?.data?.error || 'Erreur lors de la confirmation', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Exécuter le refus
    const handleRefuseOrder = async () => {
        if (!selectedOrder) return;
        
        setActionLoading(true);
        try {
            await refuseOrder(selectedOrder.id);
            setShowRefuseModal(false);
            setSelectedOrder(null);
            await loadSales(pagination.page);
            showToast('Vente refusée avec succès', 'success');
        } catch (err) {
            console.error('❌ Erreur refus:', err);
            showToast(err.response?.data?.error || 'Erreur lors du refus', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading && sales.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center text-anthracite/60">Chargement de vos ventes...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Toast notification */}
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-sm shadow-lg text-white ${
                    toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
                }`}>
                    {toast.message}
                </div>
            )}

            {/* En-tête */}
            <div className="mb-8">
                <h1 className="font-serif text-3xl text-anthracite">Mes ventes</h1>
                <p className="font-sans text-anthracite/60 mt-1">
                    Gérez les demandes d'achat de vos œuvres
                </p>
            </div>
            
            {sales.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-anthracite/60">Vous n'avez pas encore de ventes.</p>
                    <Link to="/gallery" className="text-prusse hover:underline font-sans mt-2 inline-block">
                        Voir vos œuvres en galerie →
                    </Link>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {sales.map((sale) => (
                            <div key={sale.id} className="border border-anthracite/10 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-wrap justify-between items-center gap-4">
                                    <div className="flex gap-4 items-center">
                                        <img 
                                            src={fixImageUrl(sale.image_url)} 
                                            alt={sale.artwork_title} 
                                            className="w-16 h-16 object-cover rounded-lg"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/64x64?text=Image+non+disponible';
                                            }}
                                        />
                                        <div>
                                            <Link 
                                                to={`/artwork/${sale.artwork_id}`} 
                                                className="font-serif text-anthracite hover:text-prusse transition-colors"
                                            >
                                                {sale.artwork_title}
                                            </Link>
                                            <p className="text-sm text-anthracite/60 mt-1">
                                                Acheteur: {sale.buyer_name || 'Client'}
                                            </p>
                                            <p className="text-prusse font-bold mt-1">
                                                {sale.amount} €
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        {getStatusBadge(sale.status)}
                                        <p className="text-xs text-anthracite/40 mt-1">
                                            {new Date(sale.order_date).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                        
                                        {/* Message spécifique pour les ventes refusées */}
                                        {sale.status === 'refused' && (
                                            <p className="text-xs text-orange-600 mt-1">
                                                Vous avez refusé cette vente
                                            </p>
                                        )}
                                        
                                        {/* Message pour les ventes annulées par l'acheteur */}
                                        {sale.status === 'cancelled' && (
                                            <p className="text-xs text-red-600 mt-1">
                                                L'acheteur a annulé cette commande
                                            </p>
                                        )}
                                        
                                        {sale.status === 'pending' && (
                                            <div className="flex gap-2 mt-2 justify-end">
                                                <button 
                                                    onClick={() => handleConfirmClick(sale)} 
                                                    className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700 transition-colors"
                                                    disabled={actionLoading}
                                                >
                                                    ✓ Confirmer
                                                </button>
                                                <button 
                                                    onClick={() => handleRefuseClick(sale)} 
                                                    className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 transition-colors"
                                                    disabled={actionLoading}
                                                >
                                                    ✗ Refuser
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="mt-8">
                            <Pagination
                                currentPage={pagination.page}
                                totalPages={pagination.totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Modale confirmation */}
            {showConfirmModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowConfirmModal(false)}>
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-serif text-xl text-anthracite mb-4">Confirmer la vente</h3>
                        <p className="font-sans text-anthracite/70 mb-4">
                            Êtes-vous sûr de vouloir confirmer la vente de{" "}
                            <strong className="text-prusse">{selectedOrder?.artwork_title}</strong> ?
                        </p>
                        <p className="text-sm text-anthracite/50 mb-6">
                            Montant: <strong>{selectedOrder?.amount} €</strong>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 text-anthracite/60 hover:text-anthracite transition-colors"
                                disabled={actionLoading}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleConfirmOrder}
                                disabled={actionLoading}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? 'Confirmation...' : 'Oui, confirmer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modale refus */}
            {showRefuseModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRefuseModal(false)}>
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-serif text-xl text-anthracite mb-4">Refuser la vente</h3>
                        <p className="font-sans text-anthracite/70 mb-4">
                            Êtes-vous sûr de vouloir refuser la vente de{" "}
                            <strong className="text-prusse">{selectedOrder?.artwork_title}</strong> ?
                        </p>
                        <p className="text-sm text-red-600 mb-6">
                            ⚠️ Cette action est irréversible.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowRefuseModal(false)}
                                className="px-4 py-2 text-anthracite/60 hover:text-anthracite transition-colors"
                                disabled={actionLoading}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleRefuseOrder}
                                disabled={actionLoading}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? 'Refus...' : 'Oui, refuser'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MySales;