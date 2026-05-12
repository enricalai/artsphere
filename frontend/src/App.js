import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import AdminDashboard from './pages/AdminDashboard';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import MyOrders from './pages/MyOrders';
import MyArtworks from './pages/MyArtworks';
import MySales from './pages/MySales';
import UploadArtwork from './pages/UploadArtwork';
import ArtworkDetail from './pages/ArtworkDetail';
import EditArtwork from './pages/EditArtwork';
import SearchUsersPublic from './pages/SearchUsersPublic';
import PublicUserProfile from './pages/PublicUserProfile'; // Ajout de la page de profil public

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="min-h-screen bg-creme flex items-center justify-center"><div className="text-anthracite">Chargement...</div></div>;
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    if (loading) return <div className="min-h-screen bg-creme flex items-center justify-center"><div className="text-anthracite">Chargement...</div></div>;
    return isAuthenticated && isAdmin ? children : <Navigate to="/" />;
};

function AppRoutes() {
    return (
        <div className="min-h-screen bg-creme">
            <Navbar />
            <main className="pt-8 pb-16">
                <Routes>
                    <Route path="/" element={<Gallery />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                    <Route path="/my-orders" element={<PrivateRoute><MyOrders /></PrivateRoute>} />
                    <Route path="/my-artworks" element={<PrivateRoute><MyArtworks /></PrivateRoute>} />
                    <Route path="/my-sales" element={<PrivateRoute><MySales /></PrivateRoute>} />
                    <Route path="/upload-artwork" element={<PrivateRoute><UploadArtwork /></PrivateRoute>} />
                    <Route path="/edit-artwork/:id" element={<PrivateRoute><EditArtwork /></PrivateRoute>} />
                    <Route path="/artwork/:id" element={<ArtworkDetail />} />
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="/search" element={<PrivateRoute><SearchUsersPublic /></PrivateRoute>} />
                    <Route path="/user/:id" element={<PrivateRoute><PublicUserProfile /></PrivateRoute>} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;