import React, { useState, useEffect } from 'react';
import { getMyOrders, cancelOrder } from '../services/api';
import { Link } from 'react-router-dom';
import Pagination from '../components/ui/Pagination';
import { fixImageUrl } from '../utils/imageUtils';

function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [pagination, setPagination] = useState({ 
        page: 1, 
        totalPages: 1, 
        total: 0,
        hasNext: false,
        hasPrev: false
    });

    useEffect(() => {
        loadOrders(1);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadOrders = async (page = 1) => {
        setLoading(true);
        try {
            const response = await getMyOrders(page, 10);
            
            console.log('📦 Commandes reçues:', response.data);
            
            setOrders(response.data.data || []);
            setPagination({
                page: response.data.pagination.page,
                totalPages: response.data.pagination.pages,
                total: response.data.pagination.total,
                hasNext: response.data.pagination.hasNext,
                hasPrev: response.data.pagination.hasPrev
            });
        } catch (err) {
            console.error('❌ Erreur chargement commandes:', err);
            showToast('Erreur lors du chargement des commandes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        loadOrders(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getStatusBadge = (status) => {
        switch (status) {
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

    const handleCancelClick = (order) => {
        setSelectedOrder(order);
        setShowCancelModal(true);
    };

    const handleCancelOrder = async () => {
        if (!selectedOrder) return;
        setActionLoading(true);
        try {
            await cancelOrder(selectedOrder.id);
            setShowCancelModal(false);
            setSelectedOrder(null);
            // Recharger la page courante après annulation
            await loadOrders(pagination.page);
            showToast('Commande annulée avec succès', 'success');
        } catch (err) {
            showToast(err.response?.data?.error || 'Erreur lors de l\'annulation', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadCertificate = async (orderId) => {
        setDownloadingId(orderId);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/pdf/certificate/${orderId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/pdf'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `certificat_authenticite_${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            showToast('Certificat téléchargé avec succès', 'success');
        } catch (err) {
            console.error('❌ Erreur téléchargement:', err);
            showToast('Erreur lors du téléchargement du certificat', 'error');
        } finally {
            setDownloadingId(null);
        }
    };

    if (loading && orders.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center text-anthracite/60">Chargement de vos commandes...</div>
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
                <h1 className="font-serif text-3xl text-anthracite">Mes commandes</h1>
                <p className="font-sans text-anthracite/60 mt-1">
                    Suivez l'état de vos achats
                </p>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-anthracite/60">Vous n'avez pas encore de commandes.</p>
                    <Link to="/gallery" className="text-prusse hover:underline font-sans mt-2 inline-block">
                        Découvrir des œuvres →
                    </Link>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order.id} className="border border-anthracite/10 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-wrap justify-between items-center gap-4">
                                    <div className="flex gap-4 items-center">
                                        <img
                                            src={fixImageUrl(order.image_url)}
                                            alt={order.artwork_title}
                                            className="w-16 h-16 object-cover rounded-lg"
                                            onError={(e) => { 
                                                e.target.src = 'https://via.placeholder.com/64x64?text=Image+non+disponible'; 
                                            }}
                                        />
                                        <div>
                                            <Link 
                                                to={`/artwork/${order.artwork_id}`} 
                                                className="font-serif text-anthracite hover:text-prusse transition-colors"
                                            >
                                                {order.artwork_title}
                                            </Link>
                                            <p className="text-sm text-anthracite/60 mt-1">
                                                Artiste: {order.seller_name || 'Artiste'}
                                            </p>
                                            <p className="text-prusse font-bold mt-1">
                                                {order.amount} €
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        {getStatusBadge(order.status)}
                                        <p className="text-xs text-anthracite/40 mt-1">
                                            {new Date(order.order_date).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>

                                        {order.status === 'refused' && (
                                            <p className="text-xs text-orange-600 mt-1">
                                                La vente a été refusée par l'artiste
                                            </p>
                                        )}

                                        {order.status === 'confirmed' && (
                                            <>
                                                <p className="text-xs text-green-600 mt-1">
                                                    ✓ Vente confirmée - Certificat disponible
                                                </p>
                                                <button
                                                    onClick={() => handleDownloadCertificate(order.id)}
                                                    disabled={downloadingId === order.id}
                                                    className="bg-prusse text-white px-3 py-1 text-sm mt-2 rounded hover:bg-prusse/80 transition-colors disabled:opacity-50"
                                                >
                                                    {downloadingId === order.id ? '📄 Téléchargement...' : '📄 Certificat'}
                                                </button>
                                            </>
                                        )}

                                        {order.status === 'pending' && (
                                            <button 
                                                onClick={() => handleCancelClick(order)} 
                                                className="text-red-500 text-sm mt-2 hover:underline transition-colors"
                                            >
                                                Annuler la commande
                                            </button>
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

            {/* Modal d'annulation */}
            {showCancelModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCancelModal(false)}>
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-serif text-xl text-anthracite mb-4">Annuler la commande</h3>
                        <p className="mb-4">
                            Êtes-vous sûr de vouloir annuler la commande de <strong className="text-prusse">{selectedOrder.artwork_title}</strong> ?
                        </p>
                        <p className="text-sm text-red-600 mb-6">
                            ⚠️ Cette action est irréversible.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setShowCancelModal(false)} 
                                className="px-4 py-2 text-anthracite/60 hover:text-anthracite transition-colors"
                            >
                                Non, garder
                            </button>
                            <button 
                                onClick={handleCancelOrder} 
                                disabled={actionLoading} 
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? 'Annulation...' : 'Oui, annuler'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyOrders;