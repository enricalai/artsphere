import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getDashboardStats,
    getAllUsers,
    suspendUser,
    unsuspendUser,
    getAllReports,
    resolveReport,
    createAdmin,
    deleteUser
} from '../services/api';

function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [sexeFilter, setSexeFilter] = useState('');
    const [toast, setToast] = useState(null);
    
    // États pour les modales
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [suspendTarget, setSuspendTarget] = useState(null);
    const [suspendAction, setSuspendAction] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportAction, setReportAction] = useState(null);
    
    const [newAdmin, setNewAdmin] = useState({
        email: '',
        password: '',
        nom: '',
        sexe: ''
    });
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminError, setAdminError] = useState('');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadAllData = useCallback(async () => {
        if (!user || user.role !== 'admin') {
            setError('Accès non autorisé');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const [statsRes, usersRes, reportsRes] = await Promise.all([
                getDashboardStats(),
                getAllUsers(),
                getAllReports()
            ]);

            setStats(statsRes.data || null);
            setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
            setReports(Array.isArray(reportsRes.data) ? reportsRes.data : []);
        } catch (err) {
            console.error('Erreur chargement admin:', err);
            setError('Impossible de charger les données. Veuillez réessayer.');
            setUsers([]);
            setReports([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    const handleSuspendClick = (userId, action) => {
        setSuspendTarget(userId);
        setSuspendAction(action);
        setShowSuspendModal(true);
    };

    const confirmSuspend = async () => {
        if (!suspendTarget) return;
        
        try {
            if (suspendAction === 'suspend') {
                await suspendUser(suspendTarget);
                showToast('Utilisateur suspendu avec succès', 'success');
            } else {
                await unsuspendUser(suspendTarget);
                showToast('Utilisateur réactivé avec succès', 'success');
            }
            await loadAllData();
        } catch (err) {
            console.error('Erreur:', err);
            showToast(`Impossible de ${suspendAction === 'suspend' ? 'suspendre' : 'réactiver'} l'utilisateur`, 'error');
        } finally {
            setShowSuspendModal(false);
            setSuspendTarget(null);
            setSuspendAction(null);
        }
    };

    const handleDeleteClick = (userId) => {
        setDeleteTarget(userId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        
        try {
            await deleteUser(deleteTarget);
            showToast('Utilisateur supprimé définitivement', 'success');
            await loadAllData();
        } catch (err) {
            console.error('Erreur suppression:', err);
            showToast('Impossible de supprimer l\'utilisateur', 'error');
        } finally {
            setShowDeleteModal(false);
            setDeleteTarget(null);
        }
    };

    const handleResolveReportClick = (report, action) => {
        setSelectedReport(report);
        setReportAction(action);
        setShowReportModal(true);
    };

    const confirmResolveReport = async () => {
        if (!selectedReport) return;
        
        try {
            await resolveReport(selectedReport.id, reportAction);
            showToast(reportAction === 'suspend' ? 'Cible suspendue avec succès' : 'Signalement ignoré', 'success');
            await loadAllData();
        } catch (err) {
            console.error('Erreur traitement signalement:', err);
            showToast('Impossible de traiter le signalement', 'error');
        } finally {
            setShowReportModal(false);
            setSelectedReport(null);
            setReportAction(null);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        
        if (!newAdmin.nom.trim()) {
            setAdminError('Le nom est requis');
            return;
        }
        if (!newAdmin.email.trim() || !newAdmin.email.includes('@')) {
            setAdminError('Email valide requis');
            return;
        }
        if (!newAdmin.password || newAdmin.password.length < 6) {
            setAdminError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setAdminLoading(true);
        setAdminError('');
        
        try {
            await createAdmin(newAdmin);
            setShowAdminModal(false);
            setNewAdmin({ email: '', password: '', nom: '', sexe: '' });
            showToast('Administrateur créé avec succès', 'success');
            await loadAllData();
        } catch (err) {
            setAdminError(err.response?.data?.error || 'Erreur lors de la création');
        } finally {
            setAdminLoading(false);
        }
    };

    const getSexeIcon = (sexe) => {
        if (sexe === 'homme') return '👨';
        if (sexe === 'femme') return '👩';
        return '❓';
    };

    const getSexeLabel = (sexe) => {
        if (sexe === 'homme') return 'Homme';
        if (sexe === 'femme') return 'Femme';
        return 'Non spécifié';
    };

    const filteredUsers = users.filter(u => {
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = (
                (u.nom && u.nom.toLowerCase().includes(searchLower)) ||
                (u.email && u.email.toLowerCase().includes(searchLower)) ||
                (u.ville && u.ville.toLowerCase().includes(searchLower)) ||
                (u.pays && u.pays.toLowerCase().includes(searchLower))
            );
            if (!matchesSearch) return false;
        }
        if (sexeFilter && u.sexe !== sexeFilter) return false;
        return true;
    });

    const resetFilters = () => {
        setSexeFilter('');
        setSearchTerm('');
    };

    if (user?.role !== 'admin') {
        return (
            <div className="bg-creme min-h-screen">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="text-center text-red-600">
                        Accès non autorisé. Zone réservée aux administrateurs.
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-creme min-h-screen">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="text-center text-anthracite/60">Chargement...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-creme min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Toast */}
                {toast && (
                    <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-sm shadow-lg text-white ${
                        toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
                    }`}>
                        {toast.message}
                    </div>
                )}

                {/* Message d'erreur global */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-sm flex justify-between items-center">
                        <span>{error}</span>
                        <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">✕</button>
                    </div>
                )}

                {/* HEADER */}
                <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl text-anthracite">Administration</h1>
                    <p className="font-sans text-anthracite/60 mt-2">Bienvenue, {user?.nom}</p>
                </div>

                {/* TABS */}
                <div className="flex flex-wrap border-b border-anthracite/10 mb-8">
                    <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-3 font-sans text-sm transition-colors ${
                        activeTab === 'dashboard' ? 'border-b-2 border-prusse text-prusse' : 'text-anthracite/60 hover:text-anthracite'
                    }`}>📊 Tableau de bord</button>
                    <button onClick={() => setActiveTab('users')} className={`px-6 py-3 font-sans text-sm transition-colors ${
                        activeTab === 'users' ? 'border-b-2 border-prusse text-prusse' : 'text-anthracite/60 hover:text-anthracite'
                    }`}>👥 Utilisateurs ({users.length})</button>
                    <button onClick={() => setActiveTab('reports')} className={`px-6 py-3 font-sans text-sm transition-colors ${
                        activeTab === 'reports' ? 'border-b-2 border-prusse text-prusse' : 'text-anthracite/60 hover:text-anthracite'
                    }`}>⚠️ Signalements ({reports.filter(r => r.status === 'pending').length})</button>
                </div>

                {/* DASHBOARD - simplifié pour lisibilité */}
                {activeTab === 'dashboard' && stats && (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            <div className="bg-anthracite/5 p-6 text-center rounded-sm">
                                <div className="text-3xl font-serif">{stats.stats?.total_artworks || 0}</div>
                                <div className="text-sm text-anthracite/60">Œuvres</div>
                            </div>
                            <div className="bg-anthracite/5 p-6 text-center rounded-sm">
                                <div className="text-3xl font-serif">{stats.stats?.total_users || 0}</div>
                                <div className="text-sm text-anthracite/60">Utilisateurs</div>
                            </div>
                            <div className="bg-anthracite/5 p-6 text-center rounded-sm">
                                <div className="text-3xl font-serif">{stats.stats?.total_orders || 0}</div>
                                <div className="text-sm text-anthracite/60">Commandes</div>
                            </div>
                            <div className="bg-anthracite/5 p-6 text-center rounded-sm">
                                <div className="text-3xl font-serif text-prusse">{(stats.stats?.total_revenue || 0).toLocaleString('fr-FR')} €</div>
                                <div className="text-sm text-anthracite/60">Chiffre d'affaires</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                            <button onClick={() => setActiveTab('users')} className="bg-anthracite/5 p-4 text-center hover:bg-anthracite/10 rounded-sm">
                                <div className="text-2xl mb-2">👥</div>
                                <div className="font-sans text-sm font-medium">Gérer les utilisateurs</div>
                            </button>
                            <button onClick={() => setShowAdminModal(true)} className="bg-anthracite/5 p-4 text-center hover:bg-anthracite/10 rounded-sm">
                                <div className="text-2xl mb-2">👑</div>
                                <div className="font-sans text-sm font-medium">Ajouter un admin</div>
                            </button>
                        </div>
                    </div>
                )}

                {/* USERS */}
                {activeTab === 'users' && (
                    <div>
                        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                            <div className="relative flex-1 max-w-md">
                                <input type="text" placeholder="🔍 Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 bg-transparent border border-anthracite/20 focus:border-prusse outline-none rounded-sm" />
                                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">✕</button>}
                            </div>
                            <button onClick={() => setShowAdminModal(true)} className="bg-prusse text-white px-4 py-2 text-sm hover:bg-prusse/80 rounded-sm">
                                👑 + Ajouter un administrateur
                            </button>
                        </div>

                        <div className="bg-anthracite/5 p-4 mb-6 rounded-sm">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-sans font-medium">Filtrer par sexe</h3>
                                {(sexeFilter || searchTerm) && <button onClick={resetFilters} className="text-sm text-prusse">Réinitialiser</button>}
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setSexeFilter('')} className={`px-4 py-2 rounded-sm ${!sexeFilter ? 'bg-prusse text-white' : 'bg-white border'}`}>Tous</button>
                                <button onClick={() => setSexeFilter('homme')} className={`px-4 py-2 rounded-sm flex items-center gap-2 ${sexeFilter === 'homme' ? 'bg-prusse text-white' : 'bg-white border'}`}>👨 Hommes</button>
                                <button onClick={() => setSexeFilter('femme')} className={`px-4 py-2 rounded-sm flex items-center gap-2 ${sexeFilter === 'femme' ? 'bg-prusse text-white' : 'bg-white border'}`}>👩 Femmes</button>
                            </div>
                        </div>

                        <div className="text-sm text-anthracite/50 mb-4">{filteredUsers.length} / {users.length} utilisateur(s)</div>

                        {filteredUsers.length === 0 ? (
                            <p className="text-center text-anthracite/60 py-8">Aucun utilisateur</p>
                        ) : (
                            <div className="space-y-4">
                                {filteredUsers.map((u) => (
                                    <div key={u.id} className="border p-4 flex flex-wrap items-center justify-between gap-4 rounded-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-anthracite/20 flex items-center justify-center">
                                                <span className="text-lg">{u.nom?.charAt(0) || '?'}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-serif text-lg">{u.nom}</h3>
                                                    <span>{getSexeIcon(u.sexe)}</span>
                                                </div>
                                                <p className="text-sm text-anthracite/50">{u.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div><span className="text-anthracite/50">Sexe :</span> {getSexeLabel(u.sexe)}</div>
                                            {u.age && <div><span className="text-anthracite/50">Âge :</span> {u.age} ans</div>}
                                            <div><span className="text-anthracite/50">Ville :</span> {u.ville || '-'}</div>
                                            <div><span className="text-anthracite/50">Œuvres :</span> {u.artworks_count || 0}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-xs px-2 py-1 rounded-full ${u.is_suspended ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                {u.is_suspended ? 'Suspendu' : 'Actif'}
                                            </span>
                                            {u.role !== 'admin' && u.id !== user?.id && (
                                                <>
                                                    {u.is_suspended ? (
                                                        <button onClick={() => handleSuspendClick(u.id, 'unsuspend')} className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600">
                                                            Réactiver
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleSuspendClick(u.id, 'suspend')} className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600">
                                                            Suspendre
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDeleteClick(u.id)} className="bg-gray-500 text-white px-3 py-1 text-sm rounded hover:bg-gray-600">
                                                        Supprimer
                                                    </button>
                                                </>
                                            )}
                                            {u.role === 'admin' && <span className="text-xs bg-prusse/20 text-prusse px-2 py-1 rounded-full">Administrateur</span>}
                                            {u.id === user?.id && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Vous</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* REPORTS */}
                {activeTab === 'reports' && (
                    <div>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-yellow-50 p-4 text-center rounded-sm"><div className="text-2xl">⏳</div><div className="text-2xl font-bold text-yellow-600">{reports.filter(r => r.status === 'pending').length}</div><div className="text-sm">En attente</div></div>
                            <div className="bg-green-50 p-4 text-center rounded-sm"><div className="text-2xl">✅</div><div className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === 'resolved').length}</div><div className="text-sm">Traités</div></div>
                            <div className="bg-blue-50 p-4 text-center rounded-sm"><div className="text-2xl">📊</div><div className="text-2xl font-bold text-blue-600">{reports.length}</div><div className="text-sm">Total</div></div>
                        </div>

                        {reports.length === 0 ? (
                            <p className="text-center text-anthracite/60 py-8">Aucun signalement</p>
                        ) : (
                            <div className="space-y-4">
                                {reports.map((report) => (
                                    <div key={report.id} className="border p-4 rounded-sm">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="text-sm"><span className="font-medium">Signaleur :</span> {report.reporter_name || 'Anonyme'}</p>
                                                <p className="text-sm mt-1"><span className="font-medium">Cible :</span> {report.target_name || report.artwork_title || 'N/A'}</p>
                                                <p className="text-sm mt-1"><span className="font-medium">Raison :</span> {report.reason}</p>
                                                <p className="text-sm mt-1"><span className="font-medium">Type :</span> {report.target_artwork_id ? 'Signalement d\'œuvre' : 'Signalement d\'utilisateur'}</p>
                                                <p className="text-xs text-anthracite/50 mt-2">{new Date(report.created_at).toLocaleString('fr-FR')}</p>
                                            </div>
                                            {report.status === 'pending' && (
                                                <div className="flex gap-2 ml-4">
                                                    <button onClick={() => handleResolveReportClick(report, 'ignore')} className="bg-gray-500 text-white px-3 py-1 text-sm rounded hover:bg-gray-600">Ignorer</button>
                                                    <button onClick={() => handleResolveReportClick(report, 'suspend')} className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600">Suspendre</button>
                                                </div>
                                            )}
                                            {report.status === 'resolved' && <span className="text-green-600 text-sm ml-4">✅ Traité</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* MODAL AJOUT ADMIN */}
                {showAdminModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white max-w-md w-full p-6 rounded-sm shadow-xl">
                            <h2 className="font-serif text-2xl mb-4">👑 Ajouter un administrateur</h2>
                            <form onSubmit={handleCreateAdmin} className="space-y-4">
                                <div><label className="block text-sm mb-1">Nom complet *</label><input type="text" value={newAdmin.nom} onChange={(e) => setNewAdmin({ ...newAdmin, nom: e.target.value })} className="w-full px-3 py-2 border rounded-sm" required /></div>
                                <div><label className="block text-sm mb-1">Sexe</label><select value={newAdmin.sexe} onChange={(e) => setNewAdmin({ ...newAdmin, sexe: e.target.value })} className="w-full px-3 py-2 border rounded-sm"><option value="">Non spécifié</option><option value="homme">👨 Homme</option><option value="femme">👩 Femme</option></select></div>
                                <div><label className="block text-sm mb-1">Email *</label><input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} className="w-full px-3 py-2 border rounded-sm" required /></div>
                                <div><label className="block text-sm mb-1">Mot de passe *</label><input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} className="w-full px-3 py-2 border rounded-sm" required minLength={6} />
                                <p className="text-xs text-anthracite/40 mt-1">Minimum 6 caractères</p></div>
                                {adminError && <div className="bg-red-50 text-red-600 px-3 py-2 text-sm rounded-sm">{adminError}</div>}
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => { setShowAdminModal(false); setAdminError(''); setNewAdmin({ email: '', password: '', nom: '', sexe: '' }); }} className="px-4 py-2 text-anthracite/60 hover:text-anthracite">Annuler</button>
                                    <button type="submit" disabled={adminLoading} className="bg-prusse text-white px-4 py-2 rounded-sm hover:bg-prusse/80 disabled:opacity-50">{adminLoading ? 'Création...' : 'Créer'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL SUSPENSION */}
                {showSuspendModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white max-w-md mx-4 p-6 rounded-sm shadow-xl">
                            <h3 className="font-serif text-xl mb-2">{suspendAction === 'suspend' ? '⚠️ Suspendre' : '✅ Réactiver'}</h3>
                            <p className="text-anthracite/70 mb-4">{suspendAction === 'suspend' ? 'L\'utilisateur ne pourra plus publier.' : 'L\'utilisateur pourra à nouveau publier.'}</p>
                            <p className="font-semibold mb-6">Confirmer ?</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowSuspendModal(false)} className="px-4 py-2 text-anthracite/60 hover:text-anthracite">Annuler</button>
                                <button onClick={confirmSuspend} className={`px-4 py-2 text-white rounded-sm ${suspendAction === 'suspend' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>Confirmer</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL SUPPRESSION */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white max-w-md mx-4 p-6 rounded-sm shadow-xl">
                            <h3 className="font-serif text-xl mb-2">🗑️ Supprimer</h3>
                            <p className="text-anthracite/70 mb-4">Action irréversible. Toutes les données seront supprimées.</p>
                            <p className="font-semibold mb-6">Confirmer ?</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-anthracite/60 hover:text-anthracite">Annuler</button>
                                <button onClick={confirmDelete} className="bg-red-500 text-white px-4 py-2 rounded-sm hover:bg-red-600">Supprimer</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL SIGNALEMENT */}
                {showReportModal && selectedReport && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white max-w-md mx-4 p-6 rounded-sm shadow-xl">
                            <h3 className="font-serif text-xl mb-2">{reportAction === 'suspend' ? '⚠️ Suspendre' : '📋 Ignorer'}</h3>
                            <p className="text-anthracite/70 mb-4">{reportAction === 'suspend' ? 'Cette action suspendra la cible.' : 'Ce signalement sera marqué comme traité.'}</p>
                            <p className="font-semibold mb-6">Confirmer ?</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowReportModal(false)} className="px-4 py-2 text-anthracite/60 hover:text-anthracite">Annuler</button>
                                <button onClick={confirmResolveReport} className="bg-prusse text-white px-4 py-2 rounded-sm hover:bg-prusse/80">Confirmer</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;