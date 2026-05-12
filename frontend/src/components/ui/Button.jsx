import React from 'react';

function Button({ children, variant = 'primary', onClick, type = 'button', className = '', disabled = false }) {
    const variants = {
        primary: 'bg-prusse text-creme hover:bg-prusse/90',
        secondary: 'border border-anthracite/30 text-anthracite hover:border-prusse hover:text-prusse',
        ghost: 'text-anthracite/70 hover:text-prusse',
        danger: 'border border-red-500/50 text-red-600 hover:border-red-500 hover:text-red-700',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`font-sans text-sm tracking-wide px-6 py-2 transition-all duration-200 ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {children}
        </button>
    );
}

export default Button;