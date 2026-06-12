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

// =============================================
// AUTHENTIFICATION
// =============================================
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
export const forgotPassword = (email, source) => 
    api.post('/auth/forgot-password', { email, source });
export const resetPassword = (token, newPassword) => api.post('/auth/reset-password', { token, newPassword });

// =============================================
// ŒUVRES
// =============================================
export const getArtworks = (page = 1, category = null, limit = 12) => {
    let url = `/artworks?page=${page}&limit=${limit}`;
    if (category && category !== 'all') {
        url += `&category=${category}`;
    }
    return api.get(url);
};
export const getArtworkById = (id) => api.get(`/artworks/${id}`);
export const createArtwork = (formData) => api.post('/artworks', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateArtwork = (id, data) => api.put(`/artworks/${id}`, data);
export const deleteArtwork = (id) => api.delete(`/artworks/${id}`);

// =============================================
// LIKES
// =============================================
export const addLike = (artworkId) => api.post(`/likes/${artworkId}`);
export const removeLike = (artworkId) => api.delete(`/likes/${artworkId}`);
export const checkLike = (artworkId) => api.get(`/likes/${artworkId}/check`);

// =============================================
// COMMENTAIRES
// =============================================
export const getComments = (artworkId) => api.get(`/comments/artwork/${artworkId}`);
export const addComment = (artworkId, content, parentId = null) => 
    api.post(`/comments/artwork/${artworkId}`, { content, parentId });
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`);

// =============================================
// COMMANDES
// =============================================
export const buyArtwork = (artworkId) => api.post(`/orders/buy/${artworkId}`);
export const confirmOrder = (orderId) => api.put(`/orders/confirm/${orderId}`);
export const refuseOrder = (orderId) => api.put(`/orders/refuse/${orderId}`);
export const cancelOrder = (orderId) => api.put(`/orders/cancel/${orderId}`);
export const getMyOrders = (page = 1, limit = 10) => 
    api.get(`/orders/my-orders?page=${page}&limit=${limit}`);
export const getMySales = (page = 1, limit = 10) => 
    api.get(`/orders/my-sales?page=${page}&limit=${limit}`);

// =============================================
// PDF / CERTIFICATS
// =============================================
export const downloadCertificate = (orderId) => 
    api.get(`/pdf/certificate/${orderId}`, { responseType: 'blob' });

// =============================================
// ADMINISTRATION - GÉNÉRAL
// =============================================
export const getDashboardStats = () => api.get('/admin/dashboard');
export const getAdvancedStats = () => api.get('/admin/stats/advanced');

// =============================================
// ADMINISTRATION - UTILISATEURS
// =============================================
export const getAllUsers = (page = 1, limit = 20, filters = {}) => {
    let url = `/admin/users?page=${page}&limit=${limit}`;
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
    return api.get(url);
};
export const getUserById = (userId) => api.get(`/admin/users/${userId}`);
export const suspendUser = (userId) => api.put(`/admin/users/suspend/${userId}`);
export const unsuspendUser = (userId) => api.put(`/admin/users/unsuspend/${userId}`);
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);

// =============================================
// ADMINISTRATION - ADMINISTRATEURS
// =============================================
export const getAllAdmins = () => api.get('/admin/admins');
export const createAdmin = (data) => api.post('/admin/admins', data);
export const deleteAdmin = (adminId) => api.delete(`/admin/admins/${adminId}`);

// =============================================
// ADMINISTRATION - SIGNALEMENTS
// =============================================
// getAllReports avec support des paramètres optionnels
export const getAllReports = (status = null, page = 1, limit = 20) => {
    let url = `/admin/reports?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return api.get(url);
};
export const getReportById = (reportId) => api.get(`/admin/reports/${reportId}`);
export const createReport = (data) => api.post('/reports', data);
export const resolveReport = (reportId, action) => 
    api.put(`/admin/reports/${reportId}/resolve`, { action });
export const bulkResolveReports = (reportIds, action) => 
    api.post('/admin/reports/bulk-resolve', { reportIds, action });

// =============================================
// ADMINISTRATION - ŒUVRES
// =============================================
export const getAllArtworks = (status = null, page = 1, limit = 20) => {
    let url = `/admin/artworks?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return api.get(url);
};
export const getArtworkByIdAdmin = (artworkId) => api.get(`/admin/artworks/${artworkId}`);
export const deleteArtworkAdmin = (artworkId) => api.delete(`/admin/artworks/${artworkId}`);
export const updateArtworkStatus = (artworkId, status) => 
    api.put(`/admin/artworks/${artworkId}/status`, { status });

// =============================================
// ADMINISTRATION - COMMANDES
// =============================================
export const getAllOrders = (status = null, page = 1, limit = 20) => {
    let url = `/admin/orders?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return api.get(url);
};
export const updateOrderStatus = (orderId, status) => 
    api.put(`/admin/orders/${orderId}/status`, { status });

// =============================================
// NOTIFICATIONS
// =============================================
export const getMyNotifications = (page = 1, limit = 20) => 
    api.get(`/notifications?page=${page}&limit=${limit}`);
export const markAsRead = (notificationId) => api.put(`/notifications/${notificationId}/read`);
export const markAllAsRead = () => api.put('/notifications/read-all');

// =============================================
// UTILISATEURS PUBLICS
// =============================================
export const searchUsersPublic = (query) => 
    api.get(`/public/users/search?q=${encodeURIComponent(query)}`);
export const getPublicUserProfile = (userId) => 
    api.get(`/public/users/${userId}`);
export const getUserArtworks = (userId, page = 1, limit = 12) => {
    return api.get(`/users/${userId}/artworks?page=${page}&limit=${limit}`);
};

// =============================================
// UTILITAIRES
// =============================================
export default api;