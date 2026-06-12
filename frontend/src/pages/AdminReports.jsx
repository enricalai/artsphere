import React, { useState, useEffect } from 'react';
import { getAllReports, resolveReport } from '../services/api';

function AdminReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [selectedAction, setSelectedAction] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadReports();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadReports = async () => {
        try {
            const response = await getAllReports();
            setReports(response.data);
        } catch (err) {
            console.error(err);
            showToast('Erreur lors du chargement des signalements', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (reportId, action) => {
        setSelectedReportId(reportId);
        setSelectedAction(action);
        setShowConfirmModal(true);
    };

    const handleConfirmAction = async () => {
        setActionLoading(selectedReportId);
        setShowConfirmModal(false);
        
        try {
            await resolveReport(selectedReportId, selectedAction);
            showToast(
                selectedAction === 'suspend' 
                    ? 'Cible suspendue avec succès' 
                    : 'Signalement ignoré avec succès',
                'success'
            );
            await loadReports();
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.error || 'Erreur lors du traitement', 'error');
        } finally {
            setActionLoading(null);
            setSelectedReportId(null);
            setSelectedAction(null);
        }
    };

    const getTargetName = (report) => {
        if (report.target_name) return `Utilisateur : ${report.target_name}`;
        if (report.artwork_title) return `Œuvre : ${report.artwork_title}`;
        return 'Cible inconnue';
    };

    const getStatusBadge = (status) => {
        if (status === 'pending') {
            return <span className="bg-yellow-100 text-yellow-600 px-2 py-1 text-xs rounded-full">En attente</span>;
        }
        return <span className="bg-green-100 text-green-600 px-2 py-1 text-xs rounded-full">Traité</span>;
    };

    const getActionMessage = () => {
        if (selectedAction === 'ignore') {
            return {
                title: 'Ignorer ce signalement',
                message: 'Êtes-vous sûr de vouloir ignorer ce signalement ?',
                confirmText: 'Ignorer',
                confirmClass: 'bg-gray-500 hover:bg-gray-600'
            };
        }
        return {
            title: 'Suspendre la cible',
            message: 'Êtes-vous sûr de vouloir suspendre cette cible ?',
            confirmText: 'Suspendre',
            confirmClass: 'bg-red-500 hover:bg-red-600'
        };
    };

    if (loading) {
        return <div className="text-center py-12">Chargement des signalements...</div>;
    }

    const actionMessage = getActionMessage();

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

            <div className="mb-8">
                <h1 className="font-serif text-3xl text-anthracite">Gestion des signalements</h1>
                <p className="font-sans text-anthracite/60 mt-2">
                    Modérez les signalements utilisateurs et œuvres
                </p>
            </div>

            {reports.length === 0 ? (
                <p className="text-center text-anthracite/60 py-12">Aucun signalement pour le moment.</p>
            ) : (
                <div className="space-y-4">
                    {reports.map((report) => (
                        <div key={report.id} className="border border-anthracite/10 p-4 rounded-lg">
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {getStatusBadge(report.status)}
                                        <span className="text-xs text-anthracite/40">
                                            {new Date(report.created_at).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                    
                                    <p className="font-sans text-sm">
                                        <span className="font-medium">Signaleur :</span> {report.reporter_name}
                                    </p>
                                    <p className="font-sans text-sm">
                                        <span className="font-medium">Cible :</span> {getTargetName(report)}
                                    </p>
                                    <p className="font-sans text-sm">
                                        <span className="font-medium">Raison :</span> {report.reason}
                                    </p>
                                </div>
                                
                                {report.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleActionClick(report.id, 'ignore')}
                                            disabled={actionLoading === report.id}
                                            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
                                        >
                                            {actionLoading === report.id ? '...' : 'Ignorer'}
                                        </button>
                                        <button
                                            onClick={() => handleActionClick(report.id, 'suspend')}
                                            disabled={actionLoading === report.id}
                                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
                                        >
                                            {actionLoading === report.id ? '...' : 'Suspendre'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modale de confirmation personnalisée */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl">
                        <h3 className="font-serif text-xl text-anthracite mb-4">
                            {actionMessage.title}
                        </h3>
                        <p className="font-sans text-anthracite/70 mb-6">
                            {actionMessage.message}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setSelectedReportId(null);
                                    setSelectedAction(null);
                                }}
                                className="px-4 py-2 text-anthracite/60 hover:text-anthracite transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                className={`px-4 py-2 text-white rounded transition-colors ${actionMessage.confirmClass}`}
                            >
                                {actionMessage.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminReports;