export type UserRole = 'admin' | 'partner' | 'user' | 'guest';

export type Capability = 
  | 'access:admin_console'
  | 'access:dashboard'
  | 'manage:users'
  | 'manage:roles'
  | 'read:analytics'
  | 'read:audit_logs'
  | 'access:games'
  | 'access:public_games'
  | 'read:own_profile';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  capabilities?: Capability[];
  registered?: boolean;
}

export interface AuthSession {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  name: string;
  email: string;
  role?: UserRole;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: 'starter' | 'pro' | 'enterprise';
  createdAt?: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: UserRole;
}