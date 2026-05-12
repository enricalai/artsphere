import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        nom: '',
        sexe: '',
        age: '',
        ville: '',
        pays: '',
        bio: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.nom.trim()) {
            setError('Le nom complet est requis');
            return;
        }
        if (!formData.sexe) {
            setError('Le sexe est requis');
            return;
        }
        if (!formData.email.trim()) {
            setError('L\'email est requis');
            return;
        }
        if (!formData.password) {
            setError('Le mot de passe est requis');
            return;
        }
        if (!formData.confirmPassword) {
            setError('La confirmation du mot de passe est requise');
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

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...userData } = formData;
            await register(userData);
            navigate('/gallery');
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl text-anthracite">Inscription</h1>
                <p className="font-sans text-anthracite/60 mt-2">Rejoignez la communauté ArtSphere</p>
                <p className="font-sans text-xs text-anthracite/50 mt-1">* Tous les champs sont obligatoires</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nom complet *"
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    placeholder="Jean Artiste"
                />

                {/* Sexe */}
                <div className="mb-4">
                    <label className="block font-sans text-sm text-anthracite/70 mb-2 tracking-wide">
                        Sexe *
                    </label>
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="sexe"
                                value="homme"
                                checked={formData.sexe === 'homme'}
                                onChange={handleChange}
                                className="w-4 h-4 accent-prusse"
                            />
                            <span className="font-sans text-anthracite">👨 Homme</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="sexe"
                                value="femme"
                                checked={formData.sexe === 'femme'}
                                onChange={handleChange}
                                className="w-4 h-4 accent-prusse"
                            />
                            <span className="font-sans text-anthracite">👩 Femme</span>
                        </label>
                    </div>
                </div>

                <Input
                    label="Email *"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="votre@email.com"
                />

                <Input
                    label="Mot de passe *"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Au moins 6 caractères"
                />

                <Input
                    label="Confirmer le mot de passe *"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="••••••"
                />

                <Input
                    label="Âge * (13 à 80 ans)"
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    placeholder="Entre 13 et 80 ans"
                    min="13"
                    max="80"
                />

                <Input
                    label="Ville *"
                    type="text"
                    name="ville"
                    value={formData.ville}
                    onChange={handleChange}
                    required
                    placeholder="Votre ville"
                />

                <Input
                    label="Pays *"
                    type="text"
                    name="pays"
                    value={formData.pays}
                    onChange={handleChange}
                    required
                    placeholder="Votre pays"
                />

                <div className="mb-4">
                    <label className="block font-sans text-sm text-anthracite/70 mb-1 tracking-wide">
                        Biographie *
                    </label>
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows="3"
                        required
                        className="w-full px-4 py-2 bg-transparent border border-anthracite/20 focus:border-prusse outline-none font-sans text-anthracite transition-colors rounded-sm"
                        placeholder="Parlez-nous de vous et de votre art..."
                    />
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-sm font-sans text-sm">
                        {error}
                    </div>
                )}

                <Button type="submit" variant="primary" disabled={loading} className="w-full">
                    {loading ? 'Inscription...' : "S'inscrire"}
                </Button>
            </form>

            <p className="text-center mt-6 font-sans text-sm text-anthracite/60">
                Déjà inscrit ?{' '}
                <Link to="/login" className="text-prusse hover:underline">
                    Se connecter
                </Link>
            </p>
        </div>
    );
}

export default Register;