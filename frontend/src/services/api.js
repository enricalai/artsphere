import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// AUTH
export const register = (userData) => api.post('/auth/register', userData);
export const login = (credentials) => api.post('/auth/login', credentials);
export const getProfile = () => api.get('/auth/me');
export const updateProfile = (data) => {
    const isFormData = data instanceof FormData;
    return api.put('/auth/profile', data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
};
export const changePassword = (data) => api.put('/auth/change-password', data);

// ============================================
// ARTWORKS
// ============================================
export const getArtworks = () => api.get('/artworks');
export const getArtworkById = (id) => api.get(`/artworks/${id}`);
export const createArtwork = (formData) => api.post('/artworks', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateArtwork = (id, data) => api.put(`/artworks/${id}`, data);
export const deleteArtwork = (id) => api.delete(`/artworks/${id}`);

// LIKES
export const addLike = (artworkId) => api.post(`/likes/${artworkId}`);
export const removeLike = (artworkId) => api.delete(`/likes/${artworkId}`);
export const checkLike = (artworkId) => api.get(`/likes/${artworkId}/check`);

// COMMENTS
export const getComments = (artworkId) => api.get(`/comments/artwork/${artworkId}`);
export const addComment = (artworkId, content, parentId = null) => 
    api.post(`/comments/artwork/${artworkId}`, { content, parentId });
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`);

// ORDERS
export const buyArtwork = (artworkId) => api.post(`/orders/buy/${artworkId}`);
export const confirmOrder = (orderId) => api.put(`/orders/confirm/${orderId}`);
export const refuseOrder = (orderId) => api.put(`/orders/refuse/${orderId}`); // Ajout de la fonction refuseOrder
export const cancelOrder = (orderId) => api.put(`/orders/cancel/${orderId}`);
export const getMyOrders = () => api.get('/orders/my-orders');
export const getMySales = () => api.get('/orders/my-sales');

// PDF
export const downloadCertificate = (orderId) => 
    api.get(`/pdf/certificate/${orderId}`, { responseType: 'blob' });

// ADMIN
export const getDashboardStats = () => api.get('/admin/dashboard');
export const getAllUsers = () => api.get('/admin/users');
export const suspendUser = (userId) => api.put(`/admin/users/suspend/${userId}`);
export const unsuspendUser = (userId) => api.put(`/admin/users/unsuspend/${userId}`);
export const createAdmin = (data) => api.post('/admin/admins', data);
export const getReports = () => api.get('/admin/reports');
export const resolveReport = (reportId, action) => api.put(`/admin/reports/${reportId}/resolve`, { action });
export const createReport = (data) => api.post('/reports', data);

// NOTIFICATIONS
export const getMyNotifications = () => api.get('/notifications');
export const markAsRead = (notificationId) => api.put(`/notifications/${notificationId}/read`);
export const markAllAsRead = () => api.put('/notifications/read-all');

// PUBLIC USERS (recherche d'utilisateurs)
export const searchUsersPublic = (query) => 
    api.get(`/public/users/search?q=${encodeURIComponent(query)}`);

export const getPublicUserProfile = (userId) => 
    api.get(`/public/users/${userId}`);

export default api;