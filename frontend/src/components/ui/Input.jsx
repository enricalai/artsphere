import React from 'react';

function Input({ label, type = 'text', name, value, onChange, required = false, placeholder = '', error = '' }) {
    return (
        <div className="mb-4">
            {label && (
                <label htmlFor={name} className="block font-sans text-sm text-anthracite/70 mb-1 tracking-wide">
                    {label} {required && <span className="text-prusse">*</span>}
                </label>
            )}
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                className={`w-full px-4 py-2 bg-transparent border-b ${error ? 'border-red-500' : 'border-anthracite/20'} focus:border-prusse outline-none font-sans text-anthracite transition-colors`}
            />
            {error && <p className="mt-1 text-xs text-red-500 font-sans">{error}</p>}
        </div>
    );
}

export default Input;