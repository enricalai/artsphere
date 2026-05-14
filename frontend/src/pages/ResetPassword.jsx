import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const token = searchParams.get('token');
    const source = searchParams.get('source') || 'login';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            setError('Lien invalide');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (newPassword.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await resetPassword(token, newPassword);
            setMessage(response.data.message);

            if (source === 'profile') {
                await login(response.data.email, newPassword);
                setTimeout(() => {
                    navigate('/gallery');
                }, 1500);
            } else {
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de la réinitialisation');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="max-w-md mx-auto px-4 py-12 text-center">
                <p className="text-red-500">Lien de réinitialisation invalide.</p>
                <Link to="/forgot-password" className="text-prusse hover:underline mt-4 inline-block">
                    Demander un nouveau lien
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto px-4 py-12 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl text-anthracite">Nouveau mot de passe</h1>
                <p className="font-sans text-anthracite/60 mt-2">
                    Choisissez un nouveau mot de passe
                </p>
                {source === 'profile' && (
                    <p className="font-sans text-sm text-prusse mt-2">
                        Vous allez être reconnecté automatiquement après la modification
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Nouveau mot de passe"
                    type="password"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Au moins 6 caractères"
                />

                <Input
                    label="Confirmer le mot de passe"
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirmez votre mot de passe"
                />

                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-2 rounded-sm text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-sm text-sm">
                        {error}
                    </div>
                )}

                <Button type="submit" variant="primary" disabled={loading} className="w-full">
                    {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </Button>
                
                <div className="text-center mt-4">
                    <Link to="/login" className="text-sm text-prusse hover:underline">
                        Retour à la connexion
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default ResetPassword;