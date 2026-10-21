/**
 * @file AuthContext.jsx
 * @description Authentication context provider handling login, register, logout, and token persistence.
 * @inputs User credentials, JWT stored in localStorage.
 * @outputs AuthContext containing user object, session state, and auth dispatch functions.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('caseguide_token') || null);
  const [loading, setLoading] = useState(true);

  // Load existing session on initial mount
  useEffect(() => {
    async function loadSession() {
      const storedToken = localStorage.getItem('caseguide_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.auth.getMe();
        if (res.success && res.user) {
          setUser(res.user);
          setToken(storedToken);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed, clearing auth:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('caseguide_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
  };

  const register = async (name, email, password) => {
    const res = await api.auth.register({ name, email, password });
    if (res.success && res.token) {
      localStorage.setItem('caseguide_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('caseguide_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
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
