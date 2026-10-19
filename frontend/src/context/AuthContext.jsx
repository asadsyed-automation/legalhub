import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api';
import { STORAGE_KEYS } from '../constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.TOKEN) || null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount by checking token validity against /api/v1/auth/me
  const initializeAuth = useCallback(async () => {
    const existingToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!existingToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      const userData = response?.user || response?.data?.user;
      if (userData) {
        setUser(userData);
        setToken(existingToken);
      } else {
        throw new Error('Invalid user payload');
      }
    } catch (error) {
      // Token is expired, invalid, or database rejected it -> Clean up
      console.warn('Session verification failed, logging out:', error.message);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Log in user and persist token
  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    const loggedInUser = response?.user || response?.data?.user;
    const authToken = response?.token || response?.data?.token;

    if (!authToken || !loggedInUser) {
      throw new Error('Invalid authentication response from server');
    }

    localStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
    setUser(loggedInUser);
    setToken(authToken);
    return response;
  };

  // Register user and persist token
  const register = async (payload) => {
    const response = await authApi.register(payload);
    const registeredUser = response?.user || response?.data?.user;
    const authToken = response?.token || response?.data?.token;

    if (!authToken || !registeredUser) {
      throw new Error('Invalid registration response from server');
    }

    localStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
    setUser(registeredUser);
    setToken(authToken);
    return response;
  };

  // Log out user and wipe local token
  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    setUser(null);
    setToken(null);
  };

  // Refresh user profile on demand
  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      const userData = response?.user || response?.data?.user;
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
