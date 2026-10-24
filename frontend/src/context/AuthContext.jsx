import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { uiCache } from '../utils/uiCache';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('concord_token');
    if (token) {
      api.getMe()
        .then((userData) => {
          setUser(userData);
          uiCache.setActiveUser(userData.id);
          setError(null);
        })
        .catch((err) => {
          console.warn('Session expired or invalid:', err);
          localStorage.removeItem('concord_token');
          uiCache.clearAll();
          uiCache.setActiveUser(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      // Clear previous user cache on new login
      uiCache.clearAll();
      const data = await api.login(email, password);
      localStorage.setItem('concord_token', data.access_token);
      uiCache.setActiveUser(data.user.id);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (roleCode) => {
    setLoading(true);
    setError(null);
    try {
      // Flush previous cache before switching demo persona
      uiCache.clearAll();
      const data = await api.demoLogin(roleCode);
      localStorage.setItem('concord_token', data.access_token);
      uiCache.setActiveUser(data.user.id);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('concord_token');
    uiCache.clearAll();
    uiCache.setActiveUser(null);
    setUser(null);
  };

  const hasPermission = (permissionCode) => {
    if (!user) return false;
    const isPlatformAdmin = user.roles.some((r) => r.code === 'platform_admin');
    if (isPlatformAdmin) return true;
    return user.roles.some((r) =>
      r.permissions?.some((p) => p.code === permissionCode)
    );
  };

  const hasRole = (roleCode) => {
    if (!user) return false;
    return user.roles.some((r) => r.code === roleCode);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        demoLogin,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
