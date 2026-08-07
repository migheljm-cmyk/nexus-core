'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { AppConfig } from '@nexus/config';

const ThemeContext = createContext<AppConfig['theme'] | null>(null);

export const ThemeProvider = ({
  theme,
  children,
}: {
  theme: AppConfig['theme'];
  children: React.ReactNode;
}) => {
  useEffect(() => {
    const root = document.documentElement;
    
    // Inyección de variables CSS según el manifiesto de la App
    root.style.setProperty('--nexus-primary', theme.primaryColor);
    root.style.setProperty('--nexus-accent', theme.accentColor);

    if (theme.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return context;
};