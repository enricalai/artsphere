import React, { useState, useEffect } from 'react';
import { getMyOrders, cancelOrder } from '../services/api';
import { Link } from 'react-router-dom';

function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadOrders = async () => {
        try {
            const response = await getMyOrders();
            setOrders(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
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
                return <span>{status}</span>;
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
            await loadOrders();
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
        } catch (err) {
            console.error(err);
            showToast('Erreur lors du téléchargement du certificat', 'error');
        } finally {
            setDownloadingId(null);
        }
    };

    if (loading) return <div className="text-center py-12">Chargement...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4">
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-sm shadow-lg text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                    {toast.message}
                </div>
            )}

            <h1 className="font-serif text-3xl text-anthracite mb-8">Mes commandes</h1>

            {orders.length === 0 ? (
                <p className="text-center text-anthracite/60 py-12">Vous n'avez pas encore de commandes.</p>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="border border-anthracite/10 p-4 flex flex-wrap justify-between items-center gap-4">
                            <div className="flex gap-4 items-center">
                                <img
                                    src={`http://localhost:5000/${order.image_url?.replace(/\\/g, '/')}`}
                                    alt={order.artwork_title}
                                    className="w-16 h-16 object-cover rounded-sm"
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/64x64?text=Image+non+disponible'; }}
                                />
                                <div>
                                    <Link to={`/artwork/${order.artwork_id}`} className="font-serif text-anthracite hover:text-prusse">
                                        {order.artwork_title}
                                    </Link>
                                    <p className="text-sm text-anthracite/60">Vendeur: {order.seller_name || 'Artiste'}</p>
                                    <p className="text-prusse font-bold">{order.amount} €</p>
                                </div>
                            </div>
                            <div className="text-right">
                                {getStatusBadge(order.status)}
                                <p className="text-xs text-anthracite/40 mt-1">
                                    {new Date(order.order_date).toLocaleDateString('fr-FR')}
                                </p>

                                {order.status === 'refused' && (
                                    <p className="text-xs text-orange-600 mt-1">La vente a été refusée par l'artiste</p>
                                )}

                                {order.status === 'confirmed' && (
                                    <>
                                        <p className="text-xs text-green-600 mt-1">✓ Vente confirmée - Vous pouvez télécharger votre certificat</p>
                                        <button
                                            onClick={() => handleDownloadCertificate(order.id)}
                                            disabled={downloadingId === order.id}
                                            className="bg-prusse text-white px-3 py-1 text-sm mt-2 rounded hover:bg-prusse/80 disabled:opacity-50"
                                        >
                                            {downloadingId === order.id ? '📄 Téléchargement...' : '📄 Télécharger le certificat'}
                                        </button>
                                    </>
                                )}

                                {order.status === 'pending' && (
                                    <button onClick={() => handleCancelClick(order)} className="text-red-500 text-sm mt-2 hover:underline">
                                        Annuler
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal d'annulation */}
            {showCancelModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl">
                        <h3 className="font-serif text-xl text-anthracite mb-4">Annuler la commande</h3>
                        <p className="mb-6">
                            Êtes-vous sûr de vouloir annuler la commande de <strong>{selectedOrder.artwork_title}</strong> ?
                            <br />
                            <span className="text-sm text-red-600">Cette action est irréversible.</span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 text-anthracite/60 hover:text-anthracite">Non, garder</button>
                            <button onClick={handleCancelOrder} disabled={actionLoading} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
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