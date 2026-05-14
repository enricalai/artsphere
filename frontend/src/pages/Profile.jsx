import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, changePassword } from '../services/api';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

function Profile() {
    const { user, updateUser, logout } = useAuth();
    const [formData, setFormData] = useState({
        nom: '',
        sexe: '',
        age: '',
        ville: '',
        pays: '',
        bio: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeleteAvatarModal, setShowDeleteAvatarModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [deletingAvatar, setDeletingAvatar] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await getProfile();
            const profile = response.data;
            setFormData({
                nom: profile.nom || '',
                sexe: profile.sexe || '',
                age: profile.age || '',
                ville: profile.ville || '',
                pays: profile.pays || '',
                bio: profile.bio || ''
            });
            if (profile.avatar_url) {
                setAvatarPreview(`http://localhost:5000/${profile.avatar_url}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'age') {
            if (value === '') {
                setFormData({ ...formData, age: '' });
                return;
            }
            let ageNum = parseInt(value);
            if (isNaN(ageNum)) return;
            if (ageNum < 13) ageNum = 13;
            if (ageNum > 80) ageNum = 80;
            setFormData({ ...formData, age: ageNum });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setMessage('Format d\'image non supporté.');
                setTimeout(() => setMessage(''), 3000);
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setMessage('L\'image ne doit pas dépasser 5 Mo.');
                setTimeout(() => setMessage(''), 3000);
                return;
            }
            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        }
    };

    const handleDeleteAvatarClick = () => {
        setShowDeleteAvatarModal(true);
    };

    const handleConfirmDeleteAvatar = async () => {
        setDeletingAvatar(true);
        try {
            const submitData = new FormData();
            submitData.append('nom', formData.nom);
            submitData.append('sexe', formData.sexe);
            submitData.append('age', formData.age);
            submitData.append('ville', formData.ville);
            submitData.append('pays', formData.pays);
            submitData.append('bio', formData.bio);
            submitData.append('deleteAvatar', 'true');

            const response = await updateProfile(submitData);
            updateUser({ ...formData, avatar_url: null });
            setAvatarPreview('');
            setMessage('Photo de profil supprimée avec succès');
            loadProfile();
        } catch (err) {
            setMessage(err.response?.data?.error || 'Erreur lors de la suppression');
        } finally {
            setDeletingAvatar(false);
            setShowDeleteAvatarModal(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.nom.trim()) {
            setError('Le nom complet est requis');
            return;
        }
        if (!formData.sexe) {
            setError('Le sexe est requis');
            return;
        }
        if (!formData.age) {
            setError('L\'âge est requis');
            return;
        }
        if (!formData.ville.trim()) {
            setError('La ville est requise');
            return;
        }
        if (!formData.pays.trim()) {
            setError('Le pays est requis');
            return;
        }
        if (!formData.bio.trim()) {
            setError('La biographie est requise');
            return;
        }

        const ageNum = parseInt(formData.age);
        if (isNaN(ageNum) || ageNum < 13 || ageNum > 80) {
            setError('L\'âge doit être compris entre 13 et 80 ans');
            return;
        }
        
        setLoading(true);
        setMessage('');
        setError('');

        const submitData = new FormData();
        submitData.append('nom', formData.nom);
        submitData.append('sexe', formData.sexe);
        submitData.append('age', formData.age);
        submitData.append('ville', formData.ville);
        submitData.append('pays', formData.pays);
        submitData.append('bio', formData.bio);
        if (avatarFile) {
            submitData.append('avatar', avatarFile);
        }

        try {
            const response = await updateProfile(submitData);
            updateUser({ ...formData, avatar_url: response.data.avatar_url });
            setMessage('Profil mis à jour avec succès');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.error || 'Erreur lors de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    // ========== CHANGEMENT DE MOT DE PASSE ==========
    const handlePasswordChangeSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('Les nouveaux mots de passe ne correspondent pas');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setChangingPassword(true);
        try {
            await changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordSuccess('Mot de passe modifié avec succès');
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => {
                setPasswordSuccess('');
                setShowPasswordModal(false);
            }, 2000);
        } catch (err) {
            setPasswordError(err.response?.data?.error || 'Erreur lors du changement');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/delete-account', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                logout();
                window.location.href = '/';
            } else {
                const data = await response.json();
                setMessage(data.error || 'Erreur lors de la suppression');
                setShowDeleteConfirm(false);
            }
        } catch (err) {
            console.error('Erreur:', err);
            setMessage('Erreur lors de la suppression du compte');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl text-anthracite">Mon Profil</h1>
                <p className="font-sans text-anthracite/60 mt-2">Modifiez vos informations personnelles</p>
                <p className="font-sans text-xs text-anthracite/50 mt-1">* Tous les champs sont obligatoires</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center mb-6">
                    <Avatar src={avatarPreview || user?.avatar_url} alt={formData.nom} size="xl" />
                    <label className="mt-3 cursor-pointer">
                        <span className="text-prusse text-sm font-sans hover:underline">Changer la photo de profil</span>
                        <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={handleDeleteAvatarClick}
                        className="text-red-500 text-sm hover:underline mt-1"
                    >
                        Supprimer la photo
                    </button>
                </div>

                <Input label="Nom complet *" type="text" name="nom" value={formData.nom} onChange={handleChange} required />
                
                <div className="mb-4">
                    <label className="block font-sans text-sm text-anthracite/70 mb-2 tracking-wide">Sexe *</label>
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                            <input type="radio" name="sexe" value="homme" checked={formData.sexe === 'homme'} onChange={handleChange} className="w-4 h-4 accent-prusse" />
                            <span className="font-sans text-anthracite">👨 Homme</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" name="sexe" value="femme" checked={formData.sexe === 'femme'} onChange={handleChange} className="w-4 h-4 accent-prusse" />
                            <span className="font-sans text-anthracite">👩 Femme</span>
                        </label>
                    </div>
                </div>

                <Input label="Âge * (13 à 80 ans)" type="number" name="age" value={formData.age} onChange={handleChange} required min="13" max="80" />
                <Input label="Ville *" type="text" name="ville" value={formData.ville} onChange={handleChange} required />
                <Input label="Pays *" type="text" name="pays" value={formData.pays} onChange={handleChange} required />

                <div className="mb-4">
                    <label className="block font-sans text-sm text-anthracite/70 mb-1">Biographie *</label>
                    <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4" required className="w-full px-4 py-2 bg-transparent border border-anthracite/20 focus:border-prusse outline-none font-sans text-anthracite rounded-sm" />
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-sm text-sm">{error}</div>}
                {message && <div className={`p-3 rounded-sm text-center text-sm ${message.includes('succès') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message}</div>}

                <Button type="submit" variant="primary" disabled={loading} className="w-full">
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>

                {/* Bouton Changer le mot de passe */}
                <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full mt-2 bg-anthracite/10 text-anthracite px-6 py-2 font-sans text-sm tracking-wide hover:bg-anthracite/20 transition-colors"
                >
                    🔑 Changer mon mot de passe
                </button>

                <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full mt-4 bg-red-500 text-white px-6 py-2 font-sans text-sm tracking-wide hover:bg-red-600 transition-colors"
                >
                    Supprimer mon compte
                </button>
            </form>

            {/* Modal suppression avatar */}
            {showDeleteAvatarModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl">
                        <h3 className="font-serif text-xl text-anthracite mb-4">Supprimer la photo de profil</h3>
                        <p className="font-sans text-anthracite/70 mb-6">
                            Êtes-vous sûr de vouloir supprimer votre photo de profil ?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDeleteAvatarModal(false)} className="px-4 py-2 text-anthracite/60 hover:text-anthracite">
                                Annuler
                            </button>
                            <button onClick={handleConfirmDeleteAvatar} disabled={deletingAvatar} className="bg-red-500 text-white px-4 py-2 hover:bg-red-600 disabled:opacity-50">
                                {deletingAvatar ? 'Suppression...' : 'Oui, supprimer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal changement mot de passe */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl">
                        <h3 className="font-serif text-xl text-anthracite mb-4">Changer mon mot de passe</h3>
                        <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                            <Input
                                label="Ancien mot de passe"
                                type="password"
                                name="oldPassword"
                                value={passwordData.oldPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                required
                            />
                            <Input
                                label="Nouveau mot de passe"
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                                placeholder="Au moins 6 caractères"
                            />
                            <Input
                                label="Confirmer le nouveau mot de passe"
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                            />

                            {/* Lien mot de passe oublié */}
                            <div className="text-right">
                                <Link 
                                    to="/forgot-password" 
                                    state={{ from: 'profile' }}
                                    className="text-sm text-prusse hover:underline"
                                    onClick={() => setShowPasswordModal(false)}
                                >
                                    Mot de passe oublié ?
                                </Link>
                            </div>

                            {passwordError && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-sm text-sm">
                                    {passwordError}
                                </div>
                            )}
                            {passwordSuccess && (
                                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-2 rounded-sm text-sm">
                                    {passwordSuccess}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPasswordError('');
                                        setPasswordSuccess('');
                                        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                                    }}
                                    className="px-4 py-2 text-anthracite/60 hover:text-anthracite"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={changingPassword}
                                    className="bg-prusse text-white px-4 py-2 hover:bg-prusse/80 disabled:opacity-50"
                                >
                                    {changingPassword ? 'Modification...' : 'Modifier le mot de passe'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal suppression compte */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl">
                        <h3 className="font-serif text-xl text-anthracite mb-2">⚠️ Supprimer mon compte</h3>
                        <p className="font-sans text-anthracite/70 mb-4">
                            Cette action est irréversible. Toutes vos œuvres et données seront définitivement supprimées.
                        </p>
                        <p className="font-sans text-anthracite/70 mb-6 font-semibold">
                            Êtes-vous sûr de vouloir continuer ?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-anthracite/60 hover:text-anthracite">Annuler</button>
                            <button onClick={handleDeleteAccount} disabled={deleting} className="bg-red-500 text-white px-4 py-2 hover:bg-red-600 disabled:opacity-50">
                                {deleting ? 'Suppression...' : 'Oui, supprimer mon compte'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;