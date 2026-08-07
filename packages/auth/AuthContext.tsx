import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile as GrowthUserProfile, GuestProfile, RegisteredUserProfile } from '@nexus-core/growth';
import { UserRole, AuthSession, LoginCredentials } from './types';

// Extensión para conectar los tipos de Growth con el contexto de Auth
export interface AuthUserProfile {
  name: string;
  email: string;
  role: UserRole;
  registered: boolean;
  streakCount: number;
  growthProfile?: GrowthUserProfile;
}

interface GuestProfileData {
  name?: string;
  email?: string;
  role?: string;
  registered?: boolean;
  streakCount?: number;
  tempId?: string;
}

// Almacenamiento seguro con compatibilidad SSR (Next.js)
const LocalStorageManager = {
  getProfile: (): GuestProfileData | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem('nexus_guest_profile');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  saveProfile: (data: GuestProfileData) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('nexus_guest_profile', JSON.stringify(data));
    } catch (e) {
      console.error('Error saving guest profile:', e);
    }
  },
  clearProfile: () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('nexus_guest_profile');
    } catch (e) {
      console.error('Error clearing guest profile:', e);
    }
  }
};

export interface ContextSession extends Omit<AuthSession, 'user'> {
  user: AuthUserProfile | null;
}

interface AuthContextType extends ContextSession {
  loginSuccess: (credentials: LoginCredentials) => void;
  promoteGuestToRegistered: (registeredData: Omit<RegisteredUserProfile, 'streakCount' | 'isGuest'>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface NexusAuthProviderProps {
  children: ReactNode;
}

export const NexusAuthProvider: React.FC<NexusAuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<ContextSession>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const savedProfile = LocalStorageManager.getProfile();
    if (savedProfile) {
      const assignedRole: UserRole = savedProfile.role 
        ? (savedProfile.role as UserRole) 
        : (savedProfile.registered ? 'user' : 'guest');

      const isRegistered = !!savedProfile.registered;
      const streak = savedProfile.streakCount || 0;

      const growthProfile: GrowthUserProfile = isRegistered
        ? {
            isGuest: false,
            userId: savedProfile.email || 'user_id',
            email: savedProfile.email || '',
            tier: 'free',
            streakCount: streak,
          }
        : {
            isGuest: true,
            tempId: savedProfile.tempId || 'guest_temp',
            streakCount: streak,
            createdOn: new Date().toISOString(),
          };

      setSession({
        user: {
          name: savedProfile.name || (isRegistered ? 'Usuario' : 'Guest'),
          email: savedProfile.email || '',
          role: assignedRole,
          registered: isRegistered,
          streakCount: streak,
          growthProfile,
        },
        isAuthenticated: isRegistered,
        isLoading: false,
      });
    } else {
      setSession({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const loginSuccess = (credentials: LoginCredentials) => {
    const role: UserRole = credentials.role || 'user';
    const currentStreak = session.user?.streakCount || 0;

    const registeredGrowthProfile: RegisteredUserProfile = {
      isGuest: false,
      userId: credentials.email,
      email: credentials.email,
      tier: 'free',
      streakCount: currentStreak,
    };

    const userProfile: AuthUserProfile = {
      name: credentials.name,
      email: credentials.email,
      role,
      registered: true,
      streakCount: currentStreak,
      growthProfile: registeredGrowthProfile,
    };

    LocalStorageManager.saveProfile({
      name: userProfile.name,
      email: userProfile.email,
      role: userProfile.role,
      registered: true,
      streakCount: currentStreak,
    });

    setSession({
      user: userProfile,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const promoteGuestToRegistered = (
    registeredData: Omit<RegisteredUserProfile, 'streakCount' | 'isGuest'>
  ) => {
    const currentStreak = session.user ? session.user.streakCount : 0;

    const updatedGrowthProfile: RegisteredUserProfile = {
      ...registeredData,
      isGuest: false,
      streakCount: currentStreak,
    };

    const updatedUser: AuthUserProfile = {
      name: registeredData.email.split('@')[0] || 'Usuario',
      email: registeredData.email,
      role: 'user',
      registered: true,
      streakCount: currentStreak,
      growthProfile: updatedGrowthProfile,
    };

    LocalStorageManager.saveProfile({
      name: updatedUser.name,
      email: updatedUser.email,
      role: 'user',
      registered: true,
      streakCount: currentStreak,
    });

    setSession({
      user: updatedUser,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    LocalStorageManager.clearProfile();
    setSession({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...session, loginSuccess, promoteGuestToRegistered, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useNexusAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useNexusAuth debe ser utilizado dentro de un NexusAuthProvider');
  }
  return context;
};

// Retrocompatibilidad garantizada
export const useAuth = useNexusAuth;