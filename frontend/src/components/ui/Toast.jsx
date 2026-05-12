import React, { useEffect } from 'react';

function Toast({ message, type = 'success', duration = 3000, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getTypeStyles = () => {
        switch(type) {
            case 'success':
                return 'bg-green-500 text-white';
            case 'error':
                return 'bg-red-500 text-white';
            case 'warning':
                return 'bg-yellow-500 text-white';
            default:
                return 'bg-prusse text-white';
        }
    };

    const getIcon = () => {
        switch(type) {
            case 'success':
                return '✓';
            case 'error':
                return '✗';
            case 'warning':
                return '⚠';
            default:
                return 'ℹ';
        }
    };

    return (
        <div className={`fixed bottom-4 right-4 z-50 animate-fade-in ${getTypeStyles()} px-4 py-3 rounded-sm shadow-lg flex items-center gap-3 min-w-[250px]`}>
            <span className="text-lg font-bold">{getIcon()}</span>
            <span className="font-sans text-sm">{message}</span>
        </div>
    );
}

export default Toast;