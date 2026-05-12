import React, { useState, useEffect } from 'react';
import { getMySales, confirmOrder, refuseOrder } from '../services/api'; // Changé cancelOrder en refuseOrder
import { Link } from 'react-router-dom';

function MySales() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRefuseModal, setShowRefuseModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadSales();
    }, []);

    // Fonction pour afficher un toast
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadSales = async () => {
        try {
            const response = await getMySales();
            setSales(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'pending': 
                return <span className="bg-yellow-100 text-yellow-600 px-2 py-1 text-xs rounded-full">En attente</span>;
            case 'confirmed': 
                return <span className="bg-green-100 text-green-600 px-2 py-1 text-xs rounded-full">Confirmée</span>;
            case 'cancelled': 
                return <span className="bg-red-100 text-red-600 px-2 py-1 text-xs rounded-full">Annulée</span>;
            case 'refused': // Ajout du statut refusée
                return <span className="bg-orange-100 text-orange-600 px-2 py-1 text-xs rounded-full">Refusée</span>;
            default: 
                return <span>{status}</span>;
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
            await loadSales();
            showToast('Vente confirmée avec succès', 'success');
        } catch (err) {
            console.error('Erreur confirmation:', err);
            showToast(err.response?.data?.error || 'Erreur lors de la confirmation', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Exécuter le refus avec refuseOrder au lieu de cancelOrder
    const handleRefuseOrder = async () => {
        if (!selectedOrder) return;
        
        setActionLoading(true);
        try {
            await refuseOrder(selectedOrder.id); // ← ici refuseOrder, pas cancelOrder
            setShowRefuseModal(false);
            setSelectedOrder(null);
            await loadSales();
            showToast('Vente refusée avec succès', 'success');
        } catch (err) {
            console.error('Erreur refus:', err);
            showToast(err.response?.data?.error || 'Erreur lors du refus', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="text-center py-12">Chargement...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4">
            {/* Toast notification */}
            {toast && (
                <div className={`fixed bottom-4 right-4 p-3 rounded-sm shadow-lg z-50 ${
                    toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                }`}>
                    {toast.message}
                </div>
            )}

            <h1 className="font-serif text-3xl text-anthracite mb-8">Mes ventes</h1>
            
            {sales.length === 0 ? (
                <p className="text-center text-anthracite/60 py-12">Vous n'avez pas encore de ventes.</p>
            ) : (
                <div className="space-y-4">
                    {sales.map((sale) => (
                        <div key={sale.id} className="border border-anthracite/10 p-4 flex flex-wrap justify-between items-center gap-4">
                            <div className="flex gap-4 items-center">
                                <img 
                                    src={`http://localhost:5000/${sale.image_url?.replace(/\\/g, '/')}`} 
                                    alt={sale.artwork_title} 
                                    className="w-16 h-16 object-cover"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/64x64?text=Image+non+disponible';
                                    }}
                                />
                                <div>
                                    <Link to={`/artwork/${sale.artwork_id}`} className="font-serif text-anthracite hover:text-prusse">
                                        {sale.artwork_title}
                                    </Link>
                                    <p className="text-sm text-anthracite/60">Acheteur: {sale.buyer_name || 'Client'}</p>
                                    <p className="text-prusse font-bold">{sale.amount} €</p>
                                </div>
                            </div>
                            <div className="text-right">
                                {getStatusBadge(sale.status)}
                                <p className="text-xs text-anthracite/40 mt-1">
                                    {new Date(sale.order_date).toLocaleDateString('fr-FR')}
                                </p>
                                
                                {/* Message spécifique pour les ventes refusées */}
                                {sale.status === 'refused' && (
                                    <p className="text-xs text-orange-600 mt-1">
                                        Vous avez refusé cette vente
                                    </p>
                                )}
                                
                                {sale.status === 'pending' && (
                                    <div className="flex gap-2 mt-2">
                                        <button 
                                            onClick={() => handleConfirmClick(sale)} 
                                            className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600"
                                            disabled={actionLoading}
                                        >
                                            Confirmer
                                        </button>
                                        <button 
                                            onClick={() => handleRefuseClick(sale)} 
                                            className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600"
                                            disabled={actionLoading}
                                        >
                                            Refuser
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modale confirmation */}
            {showConfirmModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl">
                        <h3 className="font-serif text-xl text-anthracite mb-4">Confirmer la vente</h3>
                        <p className="font-sans text-anthracite/70 mb-6">
                            Êtes-vous sûr de vouloir confirmer la vente de{" "}
                            <strong>{selectedOrder?.artwork_title}</strong> ?
                            <br />
                            <span className="text-sm text-anthracite/50">Montant: {selectedOrder?.amount} €</span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 text-anthracite/60 hover:text-anthracite"
                                disabled={actionLoading}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleConfirmOrder}
                                disabled={actionLoading}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Confirmation...' : 'Oui, confirmer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modale refus */}
            {showRefuseModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl">
                        <h3 className="font-serif text-xl text-anthracite mb-4">Refuser la vente</h3>
                        <p className="font-sans text-anthracite/70 mb-6">
                            Êtes-vous sûr de vouloir refuser la vente de{" "}
                            <strong>{selectedOrder?.artwork_title}</strong> ?
                            <br />
                            <span className="text-sm text-red-600">Cette action est irréversible.</span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowRefuseModal(false)}
                                className="px-4 py-2 text-anthracite/60 hover:text-anthracite"
                                disabled={actionLoading}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleRefuseOrder}
                                disabled={actionLoading}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
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