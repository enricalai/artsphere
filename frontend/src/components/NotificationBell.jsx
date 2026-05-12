import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyNotifications, markAsRead, markAllAsRead } from '../services/api';
import { useAuth } from '../context/AuthContext';

function NotificationBell() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user) {
            loadNotifications();
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await getMyNotifications();
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unread_count);
        } catch (err) {
            console.error('Erreur chargement notifications:', err);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markAsRead(notificationId);
            await loadNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            await loadNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'comment': return '💬';
            case 'reply': return '↩️';
            case 'like': return '❤️';
            case 'order': return '🛒';
            case 'order_confirmed': return '✅';
            case 'order_refused': return '❌';
            case 'order_cancelled': return '🚫';
            default: return '🔔';
        }
    };

    const handleNotificationClick = async (notif) => {
        await handleMarkAsRead(notif.id);
        setIsOpen(false);

        const type = notif.type;
        const message = notif.message.toLowerCase();

        console.log('🔍 Type notification:', type);
        console.log('🔍 Message:', message);

        // 📦 DEMANDE D'ACHAT → artiste (Mes ventes)
        if (type === 'order' || message.includes('souhaite acheter')) {
            navigate('/my-sales');
            return;
        }

        // ✅ CONFIRMATION / REFUS / ANNULATION → acheteur (Mes commandes)
        if (
            type === 'order_confirmed' ||
            type === 'order_refused' ||
            type === 'order_cancelled' ||
            type === 'confirmed' ||
            type === 'refused' ||
            type === 'cancelled' ||
            message.includes('confirmée') ||
            message.includes('refusé') ||
            message.includes('annulé')
        ) {
            navigate('/my-orders');
            return;
        }

        // 👍 LIKE / COMMENTAIRE / RÉPONSE → vers l'œuvre
        if (type === 'like' || type === 'comment' || type === 'reply') {
            if (notif.related_id) {
                navigate(`/artwork/${notif.related_id}`);
                return;
            }
        }

        // 🔁 Fallback
        navigate('/');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000 / 60);
        if (diff < 1) return 'À l\'instant';
        if (diff < 60) return `Il y a ${diff} min`;
        if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
        return `Il y a ${Math.floor(diff / 1440)}j`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative font-sans text-sm tracking-wide text-anthracite/80 hover:text-prusse transition-colors"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-creme border border-anthracite/10 shadow-lg z-50 rounded-sm">
                    <div className="flex justify-between items-center p-3 border-b border-anthracite/10">
                        <h3 className="font-serif text-anthracite">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="font-sans text-xs text-prusse hover:underline"
                            >
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-anthracite/60 font-sans text-sm">
                                Aucune notification
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`block p-3 border-b border-anthracite/5 hover:bg-anthracite/5 transition-colors cursor-pointer ${
                                        !notif.is_read ? 'bg-anthracite/5' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg">{getNotificationIcon(notif.type)}</span>
                                        <div className="flex-1">
                                            <p className="font-sans text-sm text-anthracite/80">
                                                {notif.message}
                                            </p>
                                            <span className="font-sans text-xs text-anthracite/40 mt-1 block">
                                                {formatDate(notif.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;