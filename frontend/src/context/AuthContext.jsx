import React, { createContext, useState, useContext, useEffect } from 'react';
import { getProfile, login as apiLogin, register as apiRegister } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        const loadUser = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    const response = await getProfile();
                    setUser(response.data);
                } catch (error) {
                    console.error('Erreur chargement profil:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setToken(null);
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        const response = await apiLogin({ email, password });
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(token);
        setUser(userData);
        return userData;
    };

    const register = async (userData) => {
        const response = await apiRegister(userData);
        const { token, user: userDataResponse } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userDataResponse));
        setToken(token);
        setUser(userDataResponse);
        return userDataResponse;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const updateUser = (updatedData) => {
        setUser(prev => ({ ...prev, ...updatedData }));
        localStorage.setItem('user', JSON.stringify({ ...user, ...updatedData }));
    };

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            register,
            logout,
            updateUser,
            isAdmin,
            isAuthenticated: !!user,
        }}>
            {children}
        </AuthContext.Provider>
    );
};