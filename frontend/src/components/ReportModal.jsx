import React, { useState } from 'react';
import { createReport } from '../services/api';

function ReportModal({ isOpen, onClose, targetUserId, targetArtworkId, targetType, targetName }) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            setMessage('Veuillez indiquer une raison');
            return;
        }

        setLoading(true);
        try {
            const reportData = {
                reason: reason.trim(),
                ...(targetUserId && { targetUserId }),
                ...(targetArtworkId && { targetArtworkId })
            };
            await createReport(reportData);
            setMessage('Signalement envoyé. Merci pour votre vigilance.');
            setTimeout(() => {
                onClose();
                setReason('');
                setMessage('');
            }, 2000);
        } catch (err) {
            setMessage(err.response?.data?.error || 'Erreur lors du signalement');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-creme max-w-md w-full mx-4 p-6 rounded-sm shadow-xl">
                <h3 className="font-serif text-xl text-anthracite mb-2">⚠️ Signaler</h3>
                <p className="font-sans text-sm text-anthracite/70 mb-4">
                    Vous êtes sur le point de signaler : <strong>{targetName}</strong>
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block font-sans text-sm text-anthracite/70 mb-2">
                            Raison du signalement *
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows="3"
                            className="w-full px-3 py-2 border border-anthracite/20 focus:border-prusse outline-none font-sans text-sm rounded-sm"
                            placeholder="Décrivez pourquoi vous signalez cet élément..."
                            required
                        />
                    </div>

                    {message && (
                        <div className={`mb-4 p-2 text-sm text-center rounded-sm ${message.includes('envoyé') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {message}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 font-sans text-sm text-anthracite/60 hover:text-anthracite"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-red-500 text-white font-sans text-sm hover:bg-red-600 disabled:opacity-50"
                        >
                            {loading ? 'Envoi...' : 'Signaler'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReportModal;