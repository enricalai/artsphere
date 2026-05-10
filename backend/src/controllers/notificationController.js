const db = require('../config/db');

exports.createNotification = async (userId, type, message, relatedId = null) => {
    try {
        const [result] = await db.query(
            'INSERT INTO notifications (user_id, type, message, related_id) VALUES (?, ?, ?, ?)',
            [userId, type, message, relatedId]
        );
        console.log(`✅ Notification créée pour user ${userId}: ${type}`);
        return result.insertId;
    } catch (error) {
        console.error('❌ Erreur création notification:', error);
        return null;
    }
};

exports.getMyNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const [notifications] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [userId]
        );
        const [unreadCount] = await db.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        res.json({ notifications, unread_count: unreadCount[0].count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur récupération notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id;
    try {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [notificationId, userId]);
        res.json({ message: 'Notification marquée comme lue' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur mise à jour' });
    }
};

exports.markAllAsRead = async (req, res) => {
    const userId = req.user.id;
    try {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
        res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur mise à jour' });
    }
};