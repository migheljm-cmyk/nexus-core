'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GuestProfileManager, GrowthAnalytics } from '@nexus-core/growth';

export type UserRole = 'admin' | 'partner' | 'user' | 'guest';

export interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  guestId: string;
  isAuthenticated: boolean;
  role: UserRole;
}

interface AuthContextType {
  user: UserProfile | null;
  isSignUpOpen: boolean;
  isLoginOpen: boolean;
  openSignUp: () => void;
  closeSignUp: () => void;
  openLogin: () => void;
  closeLogin: () => void;
  logout: () => void;
  loginSuccess: (userData: { name: string; email: string; role?: UserRole }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    // Carga inicial del perfil persistido casteado de forma segura para extender propiedades de usuario
    const profile = GuestProfileManager.getOrCreateProfile() as any;
    const guestId = profile?.guest_id || 'guest_unknown';

    if (profile?.registered && profile?.email) {
      const storedRole = (profile.role as UserRole) || 'user';
      setUser({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email,
        guestId,
        isAuthenticated: true,
        role: storedRole,
      });
    } else {
      setUser({
        guestId,
        isAuthenticated: false,
        role: 'guest',
      });
    }
  }, []);

  const openSignUp = () => {
    setIsLoginOpen(false);
    setIsSignUpOpen(true);
  };

  const closeSignUp = () => setIsSignUpOpen(false);

  const openLogin = () => {
    setIsSignUpOpen(false);
    setIsLoginOpen(true);
  };

  const closeLogin = () => setIsLoginOpen(false);

  const loginSuccess = (userData: { name: string; email: string; role?: UserRole }) => {
    const assignedRole = userData.role || 'user';

    const updatedUser: UserProfile = {
      guestId: user?.guestId || `guest_${Math.random().toString(36).substring(2, 9)}`,
      name: userData.name,
      email: userData.email,
      isAuthenticated: true,
      role: assignedRole,
    };

    setUser(updatedUser);

    // Persistimos los datos reales ingresados
    GuestProfileManager.updateProfile({
      registered: true,
      email: userData.email,
      name: userData.name,
      role: assignedRole,
    } as any);

    closeLogin();
    closeSignUp();
  };

  const logout = () => {
    if (user?.guestId) {
      GrowthAnalytics.getInstance().track(user.guestId, 'AUTH', 'user_logout', {
        email: user.email,
      });
    }

    GuestProfileManager.updateProfile({ registered: false, role: 'guest' } as any);

    setUser((prev) =>
      prev ? { guestId: prev.guestId, isAuthenticated: false, role: 'guest' } : null
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isSignUpOpen,
        isLoginOpen,
        openSignUp,
        closeSignUp,
        openLogin,
        closeLogin,
        logout,
        loginSuccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}