import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getArtworkById, updateArtwork } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

function EditArtwork() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [showOtherMedium, setShowOtherMedium] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'traditionnel',
        medium: '',
        otherMedium: '',
        dimensions: '',
        format: '',
        priceA3: '',
        priceA4: '',
        priceA5: '',
        singlePrice: '',
        isAvailable: true  // Ajout : disponible à la vente
    });
    const [originalArtwork, setOriginalArtwork] = useState(null);

    const mediumOptions = [
        'Huile',
        'Acrylique',
        'Aquarelle',
        'Graphite',
        'Fusain',
        'Pastel',
        'Autre'
    ];

    useEffect(() => {
        loadArtwork();
    }, [id]);

    const loadArtwork = async () => {
        try {
            const response = await getArtworkById(id);
            const artwork = response.data;
            setOriginalArtwork(artwork);
            
            // Remplir le formulaire
            setFormData({
                title: artwork.title || '',
                description: artwork.description || '',
                category: artwork.category || 'traditionnel',
                medium: artwork.medium || '',
                otherMedium: '',
                dimensions: artwork.dimensions || '',
                format: artwork.format || '',
                singlePrice: artwork.price || '',
                priceA3: '',
                priceA4: '',
                priceA5: '',
                isAvailable: artwork.is_available !== undefined ? artwork.is_available : true  // Ajout
            });
            
            // Vérifier si le médium est "Autre"
            if (artwork.medium && !mediumOptions.includes(artwork.medium)) {
                setShowOtherMedium(true);
                setFormData(prev => ({ ...prev, medium: 'Autre', otherMedium: artwork.medium }));
            }
            
        } catch (err) {
            setError('Impossible de charger l\'œuvre');
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // Gestion des checkbox
        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked });
            return;
        }
        
        setFormData({ ...formData, [name]: value });
        
        if (name === 'medium') {
            if (value === 'Autre') {
                setShowOtherMedium(true);
                setFormData(prev => ({ ...prev, medium: 'Autre', otherMedium: '' }));
            } else {
                setShowOtherMedium(false);
                setFormData(prev => ({ ...prev, otherMedium: '' }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            setError('Le titre est requis');
            return;
        }
        
        // Déterminer le médium final
        let finalMedium = '';
        if (formData.category === 'traditionnel') {
            if (formData.medium === 'Autre') {
                if (!formData.otherMedium.trim()) {
                    setError('Veuillez indiquer le médium');
                    return;
                }
                finalMedium = formData.otherMedium.trim();
            } else if (!formData.medium) {
                setError('Veuillez sélectionner un médium');
                return;
            } else {
                finalMedium = formData.medium;
            }
        }
        
        // Validation du prix si l'œuvre est disponible à la vente
        if (formData.isAvailable) {
            let hasPrice = false;
            
            if (formData.category === 'traditionnel') {
                if (formData.singlePrice && parseFloat(formData.singlePrice) > 0) {
                    hasPrice = true;
                }
            } else {
                if (formData.format === 'A3' && formData.priceA3 && parseFloat(formData.priceA3) > 0) {
                    hasPrice = true;
                } else if (formData.format === 'A4' && formData.priceA4 && parseFloat(formData.priceA4) > 0) {
                    hasPrice = true;
                } else if (formData.format === 'A5' && formData.priceA5 && parseFloat(formData.priceA5) > 0) {
                    hasPrice = true;
                }
            }
            
            if (!hasPrice && originalArtwork?.price) {
                // Si l'œuvre avait déjà un prix, on le garde
                hasPrice = true;
            }
            
            if (!hasPrice) {
                setError('Veuillez renseigner un prix valide pour une œuvre disponible à la vente');
                return;
            }
        }
        
        setLoading(true);
        setError('');
        
        const submitData = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            isAvailable: formData.isAvailable  // Ajout du champ isAvailable
        };
        
        if (formData.category === 'traditionnel') {
            submitData.medium = finalMedium;
            submitData.dimensions = formData.dimensions;
            if (formData.singlePrice && parseFloat(formData.singlePrice) > 0) {
                submitData.price = parseFloat(formData.singlePrice);
            } else if (formData.isAvailable && originalArtwork?.price) {
                // Garder le prix existant si disponible à la vente
                submitData.price = originalArtwork.price;
            }
        } else {
            submitData.format = formData.format;
            let price = 0;
            if (formData.format === 'A3' && formData.priceA3) {
                price = parseFloat(formData.priceA3);
            } else if (formData.format === 'A4' && formData.priceA4) {
                price = parseFloat(formData.priceA4);
            } else if (formData.format === 'A5' && formData.priceA5) {
                price = parseFloat(formData.priceA5);
            }
            if (price > 0) {
                submitData.price = price;
            } else if (formData.isAvailable && originalArtwork?.price) {
                // Garder le prix existant si disponible à la vente
                submitData.price = originalArtwork.price;
            }
        }
        
        try {
            await updateArtwork(id, submitData);
            navigate('/my-artworks');
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de la modification');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-12">
                <div className="text-center text-anthracite/60">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl text-anthracite">Modifier l'œuvre</h1>
                <p className="font-sans text-anthracite/60 mt-2">Modifiez les informations de votre création</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Titre *"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Nom de votre œuvre"
                />

                {/* Catégorie (non modifiable) */}
                <div className="mb-4">
                    <label className="block font-sans text-sm text-anthracite/70 mb-2 tracking-wide">
                        Catégorie
                    </label>
                    <div className="px-4 py-2 bg-anthracite/5 font-sans text-anthracite rounded-sm">
                        {formData.category === 'traditionnel' && '🖌️ Art traditionnel'}
                        {formData.category === 'photographie' && '📷 Photographie'}
                        {formData.category === 'numerique' && '💻 Art numérique'}
                    </div>
                </div>

                {/* Art traditionnel */}
                {formData.category === 'traditionnel' && (
                    <>
                        <div className="mb-4">
                            <label className="block font-sans text-sm text-anthracite/70 mb-2 tracking-wide">
                                Médium *
                            </label>
                            <select
                                name="medium"
                                value={formData.medium}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-transparent border border-anthracite/20 focus:border-prusse outline-none font-sans text-anthracite transition-colors"
                                required
                            >
                                <option value="">Sélectionnez un médium</option>
                                {mediumOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        {showOtherMedium && (
                            <Input
                                label="Précisez le médium"
                                type="text"
                                name="otherMedium"
                                value={formData.otherMedium}
                                onChange={handleChange}
                                placeholder="ex: Encre de Chine, Tempera..."
                                required
                            />
                        )}

                        <Input
                            label="Dimensions"
                            type="text"
                            name="dimensions"
                            value={formData.dimensions}
                            onChange={handleChange}
                            placeholder="ex: 50x70 cm"
                        />
                        <Input
                            label="Prix (€)"
                            type="number"
                            name="singlePrice"
                            value={formData.singlePrice}
                            onChange={handleChange}
                            placeholder="Prix de l'œuvre"
                            min="0.01"
                            step="0.01"
                            disabled={!formData.isAvailable}
                            className={!formData.isAvailable ? 'opacity-50' : ''}
                        />
                    </>
                )}

                {/* Photographie ou Art numérique */}
                {(formData.category === 'photographie' || formData.category === 'numerique') && (
                    <>
                        <div className="mb-4">
                            <label className="block font-sans text-sm text-anthracite/70 mb-2 tracking-wide">
                                Format *
                            </label>
                            <div className="flex gap-4">
                                {['A3', 'A4', 'A5'].map((fmt) => (
                                    <button
                                        key={fmt}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, format: fmt })}
                                        className={`px-4 py-2 font-sans text-sm transition-colors ${
                                            formData.format === fmt 
                                                ? 'bg-prusse text-creme' 
                                                : 'bg-transparent border border-anthracite/20 text-anthracite/70 hover:border-prusse hover:text-prusse'
                                        }`}
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {formData.format === 'A3' && (
                            <Input
                                label="Prix format A3 (€)"
                                type="number"
                                name="priceA3"
                                value={formData.priceA3}
                                onChange={handleChange}
                                placeholder="Prix pour le format A3"
                                min="0.01"
                                step="0.01"
                                disabled={!formData.isAvailable}
                                className={!formData.isAvailable ? 'opacity-50' : ''}
                            />
                        )}
                        {formData.format === 'A4' && (
                            <Input
                                label="Prix format A4 (€)"
                                type="number"
                                name="priceA4"
                                value={formData.priceA4}
                                onChange={handleChange}
                                placeholder="Prix pour le format A4"
                                min="0.01"
                                step="0.01"
                                disabled={!formData.isAvailable}
                                className={!formData.isAvailable ? 'opacity-50' : ''}
                            />
                        )}
                        {formData.format === 'A5' && (
                            <Input
                                label="Prix format A5 (€)"
                                type="number"
                                name="priceA5"
                                value={formData.priceA5}
                                onChange={handleChange}
                                placeholder="Prix pour le format A5"
                                min="0.01"
                                step="0.01"
                                disabled={!formData.isAvailable}
                                className={!formData.isAvailable ? 'opacity-50' : ''}
                            />
                        )}
                    </>
                )}

                {/* Description */}
                <div className="mb-4">
                    <label className="block font-sans text-sm text-anthracite/70 mb-1 tracking-wide">
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-2 bg-transparent border border-anthracite/20 focus:border-prusse outline-none font-sans text-anthracite rounded-sm"
                        placeholder="Décrivez votre œuvre..."
                    />
                </div>

                {/* Disponibilité à la vente */}
                <div className="mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="isAvailable"
                            checked={formData.isAvailable}
                            onChange={handleChange}
                            className="w-4 h-4 accent-prusse"
                        />
                        <span className="font-sans text-sm text-anthracite/70">
                            Cette œuvre est disponible à la vente
                        </span>
                    </label>
                    {!formData.isAvailable && (
                        <p className="font-sans text-xs text-anthracite/40 mt-1">
                            L'œuvre sera visible mais ne pourra pas être achetée.
                        </p>
                    )}
                    {originalArtwork?.is_sold && (
                        <p className="font-sans text-xs text-red-500 mt-1">
                            ⚠️ Cette œuvre a déjà été vendue et ne peut plus être modifiée.
                        </p>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-sm font-sans text-sm">
                        {error}
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/my-artworks')}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading || originalArtwork?.is_sold}
                    >
                        {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default EditArtwork;