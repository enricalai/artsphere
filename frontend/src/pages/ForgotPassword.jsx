import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await forgotPassword(email);
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de la demande');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-12 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl text-anthracite">Mot de passe oublié</h1>
                <p className="font-sans text-anthracite/60 mt-2">
                    Entrez votre email pour recevoir un lien de réinitialisation
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="votre@email.com"
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
                    {loading ? 'Envoi...' : 'Envoyer le lien'}
                </Button>
            </form>

            <p className="text-center mt-6 font-sans text-sm text-anthracite/60">
                <Link to="/login" className="text-prusse hover:underline">
                    ← Retour à la connexion
                </Link>
            </p>
        </div>
    );
}

export default ForgotPassword;