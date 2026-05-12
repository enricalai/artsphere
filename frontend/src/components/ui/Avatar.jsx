import React from 'react';
import { fixImageUrl } from '../../utils/imageUtils';

function Avatar({ src, alt, size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24'
    };

    // Récupère les initiales du nom
    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const imageUrl = fixImageUrl(src);
    const initials = getInitials(alt);

    return (
        <div className={`${sizes[size]} rounded-full overflow-hidden bg-anthracite/20 flex items-center justify-center ${className}`}>
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={alt || 'Avatar'}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span className="text-anthracite/60 font-serif text-2xl font-medium">
                    {initials}
                </span>
            )}
        </div>
    );
}

export default Avatar;