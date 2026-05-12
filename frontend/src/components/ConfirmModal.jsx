import React from 'react';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmer', cancelText = 'Annuler', variant = 'danger' }) {
    if (!isOpen) return null;

    const variantColors = {
        danger: 'bg-red-500 hover:bg-red-600',
        warning: 'bg-yellow-500 hover:bg-yellow-600',
        primary: 'bg-prusse hover:bg-prusse/90'
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-creme max-w-md w-full mx-4 p-6 rounded-sm shadow-xl">
                <h3 className="font-serif text-xl text-anthracite mb-2">{title}</h3>
                <p className="font-sans text-anthracite/70 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 font-sans text-sm text-anthracite/60 hover:text-anthracite"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-white font-sans text-sm ${variantColors[variant]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;