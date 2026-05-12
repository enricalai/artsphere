import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createArtwork } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

function UploadArtwork() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
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
        isAvailable: true
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    const mediumOptions = [
        'Huile',
        'Acrylique',
        'Aquarelle',
        'Graphite',
        'Fusain',
        'Pastel',
        'Autre'
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked });
            return;
        }
        
        // Validation pour les champs de prix (entiers seulement)
        if (name === 'singlePrice' || name === 'priceA3' || name === 'priceA4' || name === 'priceA5') {
            if (value === '') {
                setFormData({ ...formData, [name]: '' });
                return;
            }
            const intValue = parseInt(value);
            if (!isNaN(intValue) && intValue >= 1) {
                setFormData({ ...formData, [name]: intValue });
            }
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

    const handleOtherMediumChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, otherMedium: value.trim() }));
    };

    const handleCategoryChange = (category) => {
        setFormData({ 
            ...formData, 
            category, 
            format: '', 
            singlePrice: '', 
            priceA3: '', 
            priceA4: '', 
            priceA5: '',
            medium: '',
            otherMedium: ''
        });
        setShowOtherMedium(false);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setError('Format d\'image non supporté.');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('L\'image ne doit pas dépasser 5 Mo.');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            setError('Le titre est requis');
            return;
        }
        if (!imageFile) {
            setError('Une image est requise');
            return;
        }
        
        // Déterminer le médium final
        let finalMedium = '';
        if (formData.category === 'traditionnel') {
            if (formData.medium === 'Autre') {
                if (!formData.otherMedium.trim()) {
                    setError('Veuillez préciser le médium');
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
                if (formData.singlePrice && parseInt(formData.singlePrice) > 0) {
                    hasPrice = true;
                }
            } else {
                if (formData.format === 'A3' && formData.priceA3 && parseInt(formData.priceA3) > 0) {
                    hasPrice = true;
                } else if (formData.format === 'A4' && formData.priceA4 && parseInt(formData.priceA4) > 0) {
                    hasPrice = true;
                } else if (formData.format === 'A5' && formData.priceA5 && parseInt(formData.priceA5) > 0) {
                    hasPrice = true;
                }
            }
            
            if (!hasPrice) {
                setError('Veuillez renseigner un prix valide pour une œuvre disponible à la vente');
                return;
            }
        }
        
        setLoading(true);
        setError('');
        
        const submitData = new FormData();
        submitData.append('title', formData.title.trim());
        submitData.append('description', formData.description.trim());
        submitData.append('category', formData.category);
        submitData.append('isAvailable', formData.isAvailable ? 'true' : 'false');
        
        if (formData.category === 'traditionnel') {
            submitData.append('medium', finalMedium);
            submitData.append('dimensions', formData.dimensions.trim());
            if (formData.singlePrice && parseInt(formData.singlePrice) > 0) {
                submitData.append('price', parseInt(formData.singlePrice));
            }
        } else {
            submitData.append('format', formData.format);
            if (formData.format === 'A3' && formData.priceA3 && parseInt(formData.priceA3) > 0) {
                submitData.append('price', parseInt(formData.priceA3));
            } else if (formData.format === 'A4' && formData.priceA4 && parseInt(formData.priceA4) > 0) {
                submitData.append('price', parseInt(formData.priceA4));
            } else if (formData.format === 'A5' && formData.priceA5 && parseInt(formData.priceA5) > 0) {
                submitData.append('price', parseInt(formData.priceA5));
            }
        }
        
        submitData.append('image', imageFile);
        
        try {
            await createArtwork(submitData);
            navigate('/my-artworks');
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de la publication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl text-anthracite">Publier une œuvre</h1>
                <p className="font-sans text-anthracite/60 mt-2">Partagez votre création avec la communauté</p>
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

                <div className="mb-4">
                    <label className="block font-sans text-sm text-anthracite/70 mb-2 tracking-wide">
                        Catégorie *
                    </label>
                    <div className="flex flex-wrap gap-4">
                        <button
                            type="button"
                            onClick={() => handleCategoryChange('traditionnel')}
                            className={`px-4 py-2 font-sans text-sm transition-colors ${
                                formData.category === 'traditionnel' 
                                    ? 'bg-prusse text-creme' 
                                    : 'bg-transparent border border-anthracite/20 text-anthracite/70 hover:border-prusse hover:text-prusse'
                            }`}
                        >
                            🖌️ Art traditionnel
                        </button>
                        <button
                            type="button"
                            onClick={() => handleCategoryChange('photographie')}
                            className={`px-4 py-2 font-sans text-sm transition-colors ${
                                formData.category === 'photographie' 
                                    ? 'bg-prusse text-creme' 
                                    : 'bg-transparent border border-anthracite/20 text-anthracite/70 hover:border-prusse hover:text-prusse'
                            }`}
                        >
                            📷 Photographie
                        </button>
                        <button
                            type="button"
                            onClick={() => handleCategoryChange('numerique')}
                            className={`px-4 py-2 font-sans text-sm transition-colors ${
                                formData.category === 'numerique' 
                                    ? 'bg-prusse text-creme' 
                                    : 'bg-transparent border border-anthracite/20 text-anthracite/70 hover:border-prusse hover:text-prusse'
                            }`}
                        >
                            💻 Art numérique
                        </button>
                    </div>
                </div>

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
                            <div className="mb-4">
                                <label className="block font-sans text-sm text-anthracite/70 mb-1 tracking-wide">
                                    Précisez le médium *
                                </label>
                                <Input
                                    type="text"
                                    name="otherMedium"
                                    value={formData.otherMedium}
                                    onChange={handleOtherMediumChange}
                                    placeholder="ex: Encre de Chine, Tempera, Collage..."
                                    required
                                />
                            </div>
                        )}

                        <Input
                            label="Dimensions"
                            type="text"
                            name="dimensions"
                            value={formData.dimensions}
                            onChange={handleChange}
                            placeholder="ex: 50x70 cm, 100x80 cm..."
                        />
                        <Input
                            label="Prix (€)"
                            type="number"
                            name="singlePrice"
                            value={formData.singlePrice}
                            onChange={handleChange}
                            placeholder="Prix de l'œuvre"
                            min="1"
                            step="1"
                            disabled={!formData.isAvailable}
                            className={!formData.isAvailable ? 'opacity-50' : ''}
                            onKeyDown={(e) => {
                                if (e.key === '-' || e.key === 'e') {
                                    e.preventDefault();
                                }
                            }}
                        />
                    </>
                )}

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
                                min="1"
                                step="1"
                                disabled={!formData.isAvailable}
                                className={!formData.isAvailable ? 'opacity-50' : ''}
                                onKeyDown={(e) => {
                                    if (e.key === '-' || e.key === 'e') {
                                        e.preventDefault();
                                    }
                                }}
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
                                min="1"
                                step="1"
                                disabled={!formData.isAvailable}
                                className={!formData.isAvailable ? 'opacity-50' : ''}
                                onKeyDown={(e) => {
                                    if (e.key === '-' || e.key === 'e') {
                                        e.preventDefault();
                                    }
                                }}
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
                                min="1"
                                step="1"
                                disabled={!formData.isAvailable}
                                className={!formData.isAvailable ? 'opacity-50' : ''}
                                onKeyDown={(e) => {
                                    if (e.key === '-' || e.key === 'e') {
                                        e.preventDefault();
                                    }
                                }}
                            />
                        )}
                    </>
                )}

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
                </div>

                <div className="mb-4">
                    <label className="block font-sans text-sm text-anthracite/70 mb-1 tracking-wide">
                        Image de l'œuvre *
                    </label>
                    <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleImageChange}
                        className="w-full font-sans text-sm text-anthracite/60 file:mr-4 file:py-2 file:px-4 file:bg-transparent file:border file:border-anthracite/20 file:text-anthracite file:text-sm file:font-sans hover:file:border-prusse hover:file:text-prusse transition-colors"
                        required
                    />
                    <p className="font-sans text-xs text-anthracite/40 mt-1">
                        Formats acceptés : JPG, PNG, GIF, WEBP. Max 5 Mo.
                    </p>
                </div>

                {imagePreview && (
                    <div className="mt-4">
                        <img src={imagePreview} alt="Prévisualisation" className="max-h-64 mx-auto border border-anthracite/10" />
                    </div>
                )}

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
                        disabled={loading}
                    >
                        {loading ? 'Publication...' : 'Publier l\'œuvre'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default UploadArtwork;