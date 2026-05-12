import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getDashboardStats,
    getAllUsers,
    suspendUser,
    unsuspendUser,
    getReports,
    resolveReport,
    createAdmin
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
    
    // Filtre sexe (uniquement homme ou femme)
    const [sexeFilter, setSexeFilter] = useState('');
    
    // États pour le modal admin
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [newAdmin, setNewAdmin] = useState({
        email: '',
        password: '',
        nom: '',
        sexe: ''
    });
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminError, setAdminError] = useState('');
    
    // États pour la confirmation de suspension/réactivation
    const [suspendTarget, setSuspendTarget] = useState(null);
    const [suspendAction, setSuspendAction] = useState(null);

    const loadAllData = useCallback(async () => {
        // Vérifier que l'utilisateur est admin
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
                getReports()
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

    const handleSuspendClick = (userId) => {
        setSuspendTarget(userId);
        setSuspendAction('suspend');
    };

    const handleUnsuspendClick = (userId) => {
        setSuspendTarget(userId);
        setSuspendAction('unsuspend');
    };

    const confirmSuspend = async () => {
        if (!suspendTarget) return;
        
        try {
            if (suspendAction === 'suspend') {
                await suspendUser(suspendTarget);
            } else {
                await unsuspendUser(suspendTarget);
            }
            await loadAllData();
        } catch (err) {
            console.error('Erreur:', err);
            setError(`Impossible de ${suspendAction === 'suspend' ? 'suspendre' : 'réactiver'} l'utilisateur`);
        } finally {
            setSuspendTarget(null);
            setSuspendAction(null);
        }
    };

    const handleResolveReport = async (reportId, action) => {
        if (!reportId) return;
        const actionText = action === 'suspend' ? 'suspendre' : 'ignorer';
        if (window.confirm(`Traiter ce signalement (${actionText}) ?`)) {
            try {
                await resolveReport(reportId, action);
                await loadAllData();
            } catch (err) {
                console.error('Erreur traitement signalement:', err);
                setError('Impossible de traiter le signalement');
            }
        }
    };

    // Créer un nouvel administrateur
    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        
        // Validation supplémentaire
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
            await loadAllData();
        } catch (err) {
            setAdminError(err.response?.data?.error || 'Erreur lors de la création');
        } finally {
            setAdminLoading(false);
        }
    };

    // Fonctions pour le sexe
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

    // Filtrer les utilisateurs
    const filteredUsers = users.filter(u => {
        // Filtre recherche texte
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
        
        // Filtre sexe
        if (sexeFilter && u.sexe !== sexeFilter) {
            return false;
        }
        
        return true;
    });

    // Réinitialiser les filtres
    const resetFilters = () => {
        setSexeFilter('');
        setSearchTerm('');
    };

    // Statistiques des filtres
    const getFilterStats = () => {
        const totalHommes = users.filter(u => u.sexe === 'homme').length;
        const totalFemmes = users.filter(u => u.sexe === 'femme').length;
        const totalAutres = users.filter(u => u.sexe === 'autre').length;
        const totalNonSpec = users.filter(u => !u.sexe || u.sexe === '').length;
        
        return { totalHommes, totalFemmes, totalAutres, totalNonSpec };
    };

    const filterStats = getFilterStats();

    // Vérification d'accès
    if (user?.role !== 'admin') {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="text-center text-red-600">
                    Accès non autorisé. Zone réservée aux administrateurs.
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="text-center text-anthracite/60">
                    Chargement...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* HEADER */}
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl text-anthracite">
                    Administration
                </h1>
                <p className="font-sans text-anthracite/60 mt-2">
                    Bienvenue, {user?.nom}
                </p>
            </div>

            {/* Message d'erreur global */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-sm flex justify-between items-center">
                    <span>{error}</span>
                    <button 
                        onClick={() => setError('')}
                        className="text-red-600 hover:text-red-800"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* TABS */}
            <div className="flex flex-wrap border-b border-anthracite/10 mb-8">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-6 py-3 font-sans text-sm transition-colors ${
                        activeTab === 'dashboard'
                            ? 'border-b-2 border-prusse text-prusse'
                            : 'text-anthracite/60 hover:text-anthracite'
                    }`}
                >
                    📊 Tableau de bord
                </button>

                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-3 font-sans text-sm transition-colors ${
                        activeTab === 'users'
                            ? 'border-b-2 border-prusse text-prusse'
                            : 'text-anthracite/60 hover:text-anthracite'
                    }`}
                >
                    👥 Utilisateurs ({users.length})
                </button>

                <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-6 py-3 font-sans text-sm transition-colors ${
                        activeTab === 'reports'
                            ? 'border-b-2 border-prusse text-prusse'
                            : 'text-anthracite/60 hover:text-anthracite'
                    }`}
                >
                    ⚠️ Signalements ({reports.filter(r => r.status === 'pending').length})
                </button>
            </div>

            {/* ================= DASHBOARD ================= */}
            {activeTab === 'dashboard' && stats && (
                <div>
                    {/* STATS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <div className="bg-anthracite/5 p-6 text-center rounded-sm">
                            <div className="text-3xl font-serif text-anthracite">
                                {stats.stats?.total_artworks || 0}
                            </div>
                            <div className="text-sm text-anthracite/60">Œuvres</div>
                        </div>

                        <div className="bg-anthracite/5 p-6 text-center rounded-sm">
                            <div className="text-3xl font-serif text-anthracite">
                                {stats.stats?.total_users || 0}
                            </div>
                            <div className="text-sm text-anthracite/60">Utilisateurs</div>
                        </div>

                        <div className="bg-anthracite/5 p-6 text-center rounded-sm">
                            <div className="text-3xl font-serif text-anthracite">
                                {stats.stats?.total_orders || 0}
                            </div>
                            <div className="text-sm text-anthracite/60">Commandes</div>
                        </div>

                        <div className="bg-anthracite/5 p-6 text-center rounded-sm">
                            <div className="text-3xl font-serif text-prusse">
                                {(stats.stats?.total_revenue || 0).toLocaleString('fr-FR')} €
                            </div>
                            <div className="text-sm text-anthracite/60">
                                Chiffre d'affaires
                            </div>
                        </div>
                    </div>

                    {/* Statistiques par sexe */}
                    <div className="mb-12">
                        <h2 className="font-serif text-2xl text-anthracite mb-4">
                            📊 Répartition par sexe
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 text-center rounded-sm">
                                <div className="text-2xl mb-1">👨</div>
                                <div className="text-2xl font-bold text-blue-600">{filterStats.totalHommes}</div>
                                <div className="text-sm text-gray-600">Hommes</div>
                            </div>
                            <div className="bg-pink-50 p-4 text-center rounded-sm">
                                <div className="text-2xl mb-1">👩</div>
                                <div className="text-2xl font-bold text-pink-600">{filterStats.totalFemmes}</div>
                                <div className="text-sm text-gray-600">Femmes</div>
                            </div>
                        </div>
                        {(filterStats.totalAutres > 0 || filterStats.totalNonSpec > 0) && (
                            <div className="mt-2 text-center text-xs text-anthracite/40">
                                {filterStats.totalAutres > 0 && `${filterStats.totalAutres} personne(s) avec "Autre"`}
                                {filterStats.totalAutres > 0 && filterStats.totalNonSpec > 0 && ' • '}
                                {filterStats.totalNonSpec > 0 && `${filterStats.totalNonSpec} personne(s) sans sexe spécifié`}
                            </div>
                        )}
                    </div>

                    {/* TOP ARTWORKS */}
                    {stats.top_artworks && stats.top_artworks.length > 0 && (
                        <>
                            <h2 className="font-serif text-2xl text-anthracite mb-4">
                                🏆 Top 3 des œuvres les plus aimées
                            </h2>
                            <div className="grid md:grid-cols-3 gap-6 mb-12">
                                {stats.top_artworks.map((artwork, index) => (
                                    <div key={artwork.id} className="bg-anthracite/5 p-4 rounded-sm">
                                        <div className="text-prusse font-serif text-xl mb-2">
                                            #{index + 1}
                                        </div>
                                        <h3 className="font-serif text-anthracite">{artwork.title}</h3>
                                        <p className="text-sm text-anthracite/60">
                                            {artwork.artist_name}
                                        </p>
                                        <p className="text-prusse text-sm mt-2">
                                            ❤️ {artwork.likes_count} likes
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* TOP USERS */}
                    {stats.top_users && stats.top_users.length > 0 && (
                        <>
                            <h2 className="font-serif text-2xl text-anthracite mb-4">
                                👑 Top 3 des utilisateurs les plus actifs
                            </h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {stats.top_users.map((user, index) => (
                                    <div key={user.id} className="bg-anthracite/5 p-4 rounded-sm">
                                        <div className="text-prusse font-serif text-xl mb-2">
                                            #{index + 1}
                                        </div>
                                        <h3 className="font-serif text-anthracite">{user.nom}</h3>
                                        <p className="text-sm text-anthracite/60">{user.email}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span>{getSexeIcon(user.sexe)}</span>
                                            <span className="text-xs text-anthracite/60">{getSexeLabel(user.sexe)}</span>
                                        </div>
                                        <p className="text-prusse text-sm mt-2">
                                            🎨 {user.artworks_count} œuvres
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ================= USERS ================= */}
            {activeTab === 'users' && (
                <div>
                    {/* Barre de recherche + Bouton Ajouter Admin */}
                    <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                        <div className="relative flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="🔍 Rechercher par nom, email, ville ou pays..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 bg-transparent border border-anthracite/20 focus:border-prusse outline-none font-sans text-anthracite transition-colors rounded-sm"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-anthracite/40 hover:text-anthracite"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        
                        <button
                            onClick={() => setShowAdminModal(true)}
                            className="bg-prusse text-white px-4 py-2 font-sans text-sm hover:bg-prusse/80 transition-colors flex items-center gap-2 rounded-sm"
                        >
                            👑 + Ajouter un administrateur
                        </button>
                    </div>

                    {/* FILTRE PAR SEXE */}
                    <div className="bg-anthracite/5 p-4 mb-6 rounded-sm">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-sans font-medium text-anthracite">Filtrer par sexe</h3>
                            {(sexeFilter || searchTerm) && (
                                <button
                                    onClick={resetFilters}
                                    className="text-sm text-prusse hover:text-prusse/80"
                                >
                                    Réinitialiser les filtres
                                </button>
                            )}
                        </div>
                        
                        <div className="flex gap-4">
                            <button
                                onClick={() => setSexeFilter('')}
                                className={`px-4 py-2 rounded-sm transition-colors ${
                                    sexeFilter === ''
                                        ? 'bg-prusse text-white'
                                        : 'bg-white border border-anthracite/20 text-anthracite hover:bg-anthracite/5'
                                }`}
                            >
                                Tous
                            </button>
                            <button
                                onClick={() => setSexeFilter('homme')}
                                className={`px-4 py-2 rounded-sm transition-colors flex items-center gap-2 ${
                                    sexeFilter === 'homme'
                                        ? 'bg-prusse text-white'
                                        : 'bg-white border border-anthracite/20 text-anthracite hover:bg-anthracite/5'
                                }`}
                            >
                                <span>👨</span> Hommes
                            </button>
                            <button
                                onClick={() => setSexeFilter('femme')}
                                className={`px-4 py-2 rounded-sm transition-colors flex items-center gap-2 ${
                                    sexeFilter === 'femme'
                                        ? 'bg-prusse text-white'
                                        : 'bg-white border border-anthracite/20 text-anthracite hover:bg-anthracite/5'
                                }`}
                            >
                                <span>👩</span> Femmes
                            </button>
                        </div>
                        
                        {/* Affichage des filtres actifs */}
                        {(sexeFilter || searchTerm) && (
                            <div className="mt-3 pt-3 border-t border-anthracite/10">
                                <div className="text-xs text-anthracite/50 mb-2">Filtres actifs :</div>
                                <div className="flex flex-wrap gap-2">
                                    {sexeFilter && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-prusse/10 text-prusse text-xs rounded-sm">
                                            {getSexeIcon(sexeFilter)} {getSexeLabel(sexeFilter)}
                                            <button onClick={() => setSexeFilter('')} className="hover:text-prusse/70">×</button>
                                        </span>
                                    )}
                                    {searchTerm && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-prusse/10 text-prusse text-xs rounded-sm">
                                            Recherche: "{searchTerm}"
                                            <button onClick={() => setSearchTerm('')} className="hover:text-prusse/70">×</button>
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-sm text-anthracite/50 mb-4">
                        {filteredUsers.length} / {users.length} utilisateur(s)
                    </div>

                    {/* Liste des utilisateurs filtrés */}
                    {filteredUsers.length === 0 ? (
                        <p className="text-center text-anthracite/60 py-8">
                            Aucun utilisateur ne correspond aux critères
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {filteredUsers.map((u) => (
                                <div key={u.id} className="border border-anthracite/10 p-4 flex flex-wrap items-center justify-between gap-4 rounded-sm hover:shadow-md transition-shadow">
                                    {/* Photo + Nom + Email */}
                                    <div className="flex items-center gap-4">
                                        {u.avatar_url ? (
                                            <img 
                                                src={`http://localhost:5000/${u.avatar_url}`} 
                                                alt={u.nom}
                                                className="w-12 h-12 rounded-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className="w-12 h-12 rounded-full bg-anthracite/20 flex items-center justify-center" style={{ display: u.avatar_url ? 'none' : 'flex' }}>
                                            <span className="text-lg font-serif text-anthracite/50">
                                                {u.nom?.charAt(0) || '?'}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-serif text-lg text-anthracite">{u.nom || 'Sans nom'}</h3>
                                                {u.sexe === 'homme' && <span className="text-lg" title="Homme">👨</span>}
                                                {u.sexe === 'femme' && <span className="text-lg" title="Femme">👩</span>}
                                                {u.sexe === 'autre' && <span className="text-lg" title="Autre">🌈</span>}
                                                {(!u.sexe || u.sexe === '') && <span className="text-lg" title="Non spécifié">❓</span>}
                                            </div>
                                            <p className="font-sans text-sm text-anthracite/50">{u.email}</p>
                                        </div>
                                    </div>

                                    {/* Infos */}
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <div>
                                            <span className="font-sans text-anthracite/50">Sexe :</span>
                                            <span className="font-sans text-anthracite ml-1">
                                                {getSexeLabel(u.sexe)}
                                            </span>
                                        </div>
                                        {u.age && (
                                            <div>
                                                <span className="font-sans text-anthracite/50">Âge :</span>
                                                <span className="font-sans text-anthracite ml-1 font-medium">
                                                    {u.age} ans
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="font-sans text-anthracite/50">Ville :</span>
                                            <span className="font-sans text-anthracite ml-1">{u.ville || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="font-sans text-anthracite/50">Pays :</span>
                                            <span className="font-sans text-anthracite ml-1">{u.pays || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="font-sans text-anthracite/50">Œuvres :</span>
                                            <span className="font-sans text-anthracite ml-1 font-medium">{u.artworks_count || 0}</span>
                                        </div>
                                        <div>
                                            <span className="font-sans text-anthracite/50">Inscrit :</span>
                                            <span className="font-sans text-anthracite ml-1">
                                                {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '-'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Statut + Actions */}
                                    <div className="flex items-center gap-4">
                                        <span className={`text-xs px-2 py-1 rounded-full ${u.is_suspended ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {u.is_suspended ? 'Suspendu' : 'Actif'}
                                        </span>
                                        
                                        {u.role !== 'admin' && u.id !== user?.id && (
                                            u.is_suspended ? (
                                                <button
                                                    onClick={() => handleUnsuspendClick(u.id)}
                                                    className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600 transition-colors"
                                                >
                                                    Réactiver
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleSuspendClick(u.id)}
                                                    className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600 transition-colors"
                                                >
                                                    Suspendre
                                                </button>
                                            )
                                        )}
                                        {u.role === 'admin' && (
                                            <span className="text-xs bg-prusse/20 text-prusse px-2 py-1 rounded-full">
                                                Administrateur
                                            </span>
                                        )}
                                        {u.id === user?.id && (
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                                Vous
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ================= REPORTS ================= */}
            {activeTab === 'reports' && (
                <div className="space-y-4">
                    {reports.length === 0 ? (
                        <p className="text-center text-anthracite/60 py-8">Aucun signalement</p>
                    ) : (
                        reports.map((report) => (
                            <div key={report.id} className="border border-anthracite/10 p-4 rounded-sm">
                                <p className="font-sans text-sm">
                                    <span className="font-medium">Signaleur :</span> {report.reporter_name || 'Anonyme'}
                                </p>
                                <p className="font-sans text-sm mt-1">
                                    <span className="font-medium">Cible :</span> {report.target_name || report.artwork_title || 'N/A'}
                                </p>
                                <p className="font-sans text-sm mt-1">
                                    <span className="font-medium">Raison :</span> {report.reason}
                                </p>
                                <p className="font-sans text-sm mt-1 text-anthracite/60">
                                    <span className="font-medium">Statut :</span>{' '}
                                    {report.status === 'pending' ? 'En attente' : 'Traité'}
                                </p>
                                <p className="font-sans text-xs text-anthracite/50 mt-2">
                                    {report.created_at ? new Date(report.created_at).toLocaleDateString('fr-FR') : '-'}
                                </p>

                                {report.status === 'pending' && (
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleResolveReport(report.id, 'dismiss')}
                                            className="bg-gray-500 text-white px-3 py-1 text-sm hover:bg-gray-600 transition-colors rounded-sm"
                                        >
                                            Ignorer
                                        </button>
                                        <button
                                            onClick={() => handleResolveReport(report.id, 'suspend')}
                                            className="bg-red-500 text-white px-3 py-1 text-sm hover:bg-red-600 transition-colors rounded-sm"
                                        >
                                            Suspendre l'utilisateur
                                        </button>
                                    </div>
                                )}

                                {report.status === 'resolved' && (
                                    <span className="text-green-600 text-sm mt-2 inline-block">
                                        ✅ Traité
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ================= MODAL AJOUT ADMIN ================= */}
            {showAdminModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white max-w-md w-full mx-4 p-6 rounded-sm shadow-xl">
                        <h2 className="font-serif text-2xl text-anthracite mb-4">
                            👑 Ajouter un administrateur
                        </h2>
                        
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div>
                                <label className="block font-sans text-sm text-anthracite/70 mb-1">
                                    Nom complet *
                                </label>
                                <input
                                    type="text"
                                    value={newAdmin.nom}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, nom: e.target.value })}
                                    className="w-full px-3 py-2 border border-anthracite/20 focus:border-prusse outline-none font-sans rounded-sm"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block font-sans text-sm text-anthracite/70 mb-1">
                                    Sexe
                                </label>
                                <select
                                    value={newAdmin.sexe}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, sexe: e.target.value })}
                                    className="w-full px-3 py-2 border border-anthracite/20 focus:border-prusse outline-none font-sans rounded-sm"
                                >
                                    <option value="">Non spécifié</option>
                                    <option value="homme">👨 Homme</option>
                                    <option value="femme">👩 Femme</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block font-sans text-sm text-anthracite/70 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={newAdmin.email}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-anthracite/20 focus:border-prusse outline-none font-sans rounded-sm"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block font-sans text-sm text-anthracite/70 mb-1">
                                    Mot de passe *
                                </label>
                                <input
                                    type="password"
                                    value={newAdmin.password}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-anthracite/20 focus:border-prusse outline-none font-sans rounded-sm"
                                    required
                                    minLength={6}
                                />
                                <p className="font-sans text-xs text-anthracite/40 mt-1">
                                    Minimum 6 caractères
                                </p>
                            </div>

                            {adminError && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 text-sm rounded-sm">
                                    {adminError}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAdminModal(false);
                                        setAdminError('');
                                        setNewAdmin({ email: '', password: '', nom: '', sexe: '' });
                                    }}
                                    className="px-4 py-2 font-sans text-sm text-anthracite/60 hover:text-anthracite transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={adminLoading}
                                    className="bg-prusse text-white px-4 py-2 font-sans text-sm hover:bg-prusse/80 transition-colors disabled:opacity-50 rounded-sm"
                                >
                                    {adminLoading ? 'Création...' : 'Créer l\'administrateur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= MODAL DE CONFIRMATION SUSPENSION ================= */}
            {suspendTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl">
                        <h3 className="font-serif text-xl text-anthracite mb-2">
                            {suspendAction === 'suspend' ? '⚠️ Suspendre l\'utilisateur' : '✅ Réactiver l\'utilisateur'}
                        </h3>
                        <p className="font-sans text-anthracite/70 mb-4">
                            {suspendAction === 'suspend' 
                                ? 'Cet utilisateur ne pourra plus publier ni commenter. Ses œuvres seront masquées.'
                                : 'L\'utilisateur pourra à nouveau publier et interagir sur la plateforme.'}
                        </p>
                        <p className="font-sans text-anthracite/70 mb-6 font-semibold">
                            Êtes-vous sûr de vouloir continuer ?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => {
                                    setSuspendTarget(null);
                                    setSuspendAction(null);
                                }} 
                                className="px-4 py-2 font-sans text-sm text-anthracite/60 hover:text-anthracite transition-colors"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={confirmSuspend} 
                                className={`px-4 py-2 font-sans text-sm text-white rounded-sm transition-colors ${
                                    suspendAction === 'suspend' 
                                        ? 'bg-red-500 hover:bg-red-600' 
                                        : 'bg-green-500 hover:bg-green-600'
                                }`}
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;