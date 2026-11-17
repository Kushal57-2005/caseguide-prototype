/**
 * @file ThemeContext.jsx
 * @description Centralized Theme Provider supporting Light, Dark, and System preferences.
 * Persists theme in localStorage and dynamically applies data-theme on document.documentElement.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => {}
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('caseguide_theme') || 'system';
    } catch {
      return 'system';
    }
  });

  const [systemTheme, setSystemTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Track system OS color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme = useMemo(() => {
    if (theme === 'system') return systemTheme;
    return theme === 'light' ? 'light' : 'dark';
  }, [theme, systemTheme]);

  // Apply data-theme attribute on documentElement
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('caseguide_theme', newTheme);
    } catch (e) {
      console.warn('Could not persist theme to localStorage', e);
    }
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme
    }),
    [theme, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
