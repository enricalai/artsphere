import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import NotificationBell from '../NotificationBell';

function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const handleConfirmLogout = () => {
        logout();
        navigate('/');
        setIsMobileMenuOpen(false);
        setShowLogoutConfirm(false);
    };

    const handleCancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    const NavLink = ({ to, children }) => (
        <Link
            to={to}
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-sans text-sm tracking-wide text-anthracite/80 hover:text-prusse transition-colors"
        >
            {children}
        </Link>
    );

    const MobileNavLink = ({ to, children }) => (
        <Link
            to={to}
            onClick={() => setIsMobileMenuOpen(false)}
            className="block font-sans text-base tracking-wide text-anthracite/80 hover:text-prusse transition-colors py-2"
        >
            {children}
        </Link>
    );

    return (
        <>
            <nav className="border-b border-anthracite/10 bg-creme/90 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="font-serif text-xl sm:text-2xl tracking-wide text-anthracite hover:text-prusse transition-colors">
                            ARTSPHERE
                        </Link>

                        {/* Menu Desktop */}
                        <div className="hidden md:flex items-center space-x-8">
                            <NavLink to="/gallery">Galerie</NavLink>
                            {user ? (
                                <>
                                    <NavLink to="/profile">
                                        <div className="flex items-center gap-2">
                                            <Avatar src={user?.avatar_url} alt={user?.nom} size="sm" />
                                            <span>Mon Profil</span>
                                        </div>
                                    </NavLink>
                                    <NavLink to="/my-artworks">Mes œuvres</NavLink>
                                    <NavLink to="/my-orders">Mes commandes</NavLink>
                                    <NavLink to="/my-sales">Mes ventes</NavLink>
                                    {isAdmin && <NavLink to="/admin">Administration</NavLink>}
                                    <NotificationBell />
                                    <button onClick={handleLogoutClick} className="font-sans text-sm tracking-wide text-anthracite/80 hover:text-prusse transition-colors">
                                        Déconnexion
                                    </button>
                                </>
                            ) : (
                                <>
                                    <NavLink to="/login">Connexion</NavLink>
                                    <NavLink to="/register">Inscription</NavLink>
                                </>
                            )}
                        </div>

                        {/* Bouton Menu Mobile */}
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden font-sans text-sm tracking-wider text-anthracite hover:text-prusse transition-colors">
                            {isMobileMenuOpen ? 'FERMER' : 'MENU'}
                        </button>
                    </div>
                </div>

                {/* Menu Mobile */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-creme border-t border-anthracite/10 animate-fade-in">
                        <div className="px-4 py-4 space-y-3">
                            <MobileNavLink to="/gallery">Galerie</MobileNavLink>
                            {user ? (
                                <>
                                    <MobileNavLink to="/profile">
                                        <div className="flex items-center gap-2">
                                            <Avatar src={user?.avatar_url} alt={user?.nom} size="sm" />
                                            <span>Mon Profil</span>
                                        </div>
                                    </MobileNavLink>
                                    <MobileNavLink to="/my-artworks">Mes œuvres</MobileNavLink>
                                    <MobileNavLink to="/my-orders">Mes commandes</MobileNavLink>
                                    <MobileNavLink to="/my-sales">Mes ventes</MobileNavLink>
                                    {isAdmin && <MobileNavLink to="/admin">Administration</MobileNavLink>}
                                    <button onClick={handleLogoutClick} className="block w-full text-left font-sans text-base tracking-wide text-anthracite/80 hover:text-prusse transition-colors py-2">
                                        Déconnexion
                                    </button>
                                </>
                            ) : (
                                <>
                                    <MobileNavLink to="/login">Connexion</MobileNavLink>
                                    <MobileNavLink to="/register">Inscription</MobileNavLink>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Modal de confirmation déconnexion */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl">
                        <h3 className="font-serif text-xl text-anthracite mb-2">Déconnexion</h3>
                        <p className="font-sans text-anthracite/70 mb-6">Voulez-vous vraiment vous déconnecter ?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={handleCancelLogout} className="font-sans text-sm text-anthracite/60 hover:text-anthracite px-4 py-2">Annuler</button>
                            <button onClick={handleConfirmLogout} className="font-sans text-sm bg-prusse text-creme px-4 py-2 hover:bg-prusse/90">Se déconnecter</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Navbar;