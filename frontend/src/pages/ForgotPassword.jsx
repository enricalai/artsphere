/* eslint-disable */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import emailjs from '@emailjs/browser';

function ForgotPassword() {
    const location = useLocation();
    const navigate = useNavigate();
    const source = location.state?.source || 'login';
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
            const response = await forgotPassword(email, source);
            const { token, resetLink, nom } = response.data;

            const templateParams = {
                nom: nom || email.split('@')[0],
                lien: resetLink,
                to_email: email
            };

            await emailjs.send(
                'service_x4oskpy',
                'template_3gvu6kw',
                templateParams,
                'A9Y0CJG-BEYUA3DEL'
            );

            setMessage('Un email vous a été envoyé avec un lien de réinitialisation.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error('Erreur EmailJS:', err);
            setError(err.text || 'Erreur lors de l\'envoi de l\'email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-12">
            <h1 className="font-serif text-3xl text-center mb-4">Mot de passe oublié</h1>
            <p className="text-center text-anthracite/60 mb-8">
                Entrez votre email pour recevoir un lien de réinitialisation
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="votre@email.com"
                    className="w-full px-4 py-2 border border-anthracite/20 focus:border-prusse outline-none bg-transparent rounded-sm"
                />

                {message && (
                    <div className="bg-green-50 text-green-600 p-3 rounded text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-prusse text-white w-full px-6 py-2 text-sm hover:bg-prusse/80 transition-colors rounded-sm"
                >
                    {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                </button>
            </form>
        </div>
    );
}

export default ForgotPassword;