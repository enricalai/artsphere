import React from 'react';
import { useNavigate } from 'react-router-dom';

function ArtworkCard({ artwork }) {
    const navigate = useNavigate();

    const formatPrice = (price) => {
        if (!price) return 'Prix sur demande';
        return `${price} €`;
    };

    return (
        <div
            onClick={() => navigate(`/artwork/${artwork.id}`)}
            className="group cursor-pointer transition-all duration-300 hover:translate-y-[-4px] animate-fade-in"
        >
            <div className="bg-creme overflow-hidden border border-anthracite/5">
                <img
                    src={`http://localhost:5000/${artwork.image_url}`}
                    alt={artwork.title}
                    className="w-full h-auto object-cover transition-opacity duration-500 group-hover:opacity-95"
                    loading="lazy"
                />
            </div>

            <div className="mt-3 text-center md:text-left">
                <h3 className="text-anthracite text-lg font-serif tracking-wide">
                    {artwork.title}
                </h3>
                <p className="text-anthracite/60 text-sm font-sans mt-1">
                    {artwork.artist_name} • {artwork.medium || 'Médium non spécifié'}
                </p>
                <p className="text-anthracite/80 text-sm font-sans mt-2">
                    {artwork.dimensions || 'Dimensions non spécifiées'}
                </p>
                <p className="text-prusse text-sm font-sans mt-2 font-medium">
                    {formatPrice(artwork.price)}
                    {artwork.is_sold && <span className="ml-2 text-anthracite/50 line-through">Vendu</span>}
                </p>
            </div>
        </div>
    );
}

export default ArtworkCard;