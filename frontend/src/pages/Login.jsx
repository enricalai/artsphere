import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/gallery');
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur de connexion. Vérifiez vos identifiants.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl text-anthracite">Connexion</h1>
                <p className="font-sans text-anthracite/60 mt-2">Retrouvez votre galerie personnelle</p>
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

                <Input
                    label="Mot de passe"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••"
                />

                <Link 
                    to="/forgot-password" 
                    className="text-prusse text-sm hover:underline block mt-[-0.5rem] text-right"
                >
                    Mot de passe oublié ?
                </Link>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-sm font-sans text-sm">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="w-full"
                >
                    {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
            </form>

            <p className="text-center mt-6 font-sans text-sm text-anthracite/60">
                Pas encore de compte ?{' '}
                <Link to="/register" className="text-prusse hover:underline">
                    Créer un compte
                </Link>
            </p>
        </div>
    );
}

export default Login;