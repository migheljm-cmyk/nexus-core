import { UserRole, Capability, UserProfile } from './types';

const DEFAULT_ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  admin: [
    'access:admin_console',
    'access:dashboard',
    'manage:users',
    'manage:roles',
    'read:analytics',
    'read:audit_logs',
    'access:games',
    'read:own_profile',
  ],
  partner: [
    'access:dashboard',
    'read:analytics',
    'access:games',
    'read:own_profile',
  ],
  user: [
    'access:games',
    'read:own_profile',
  ],
  guest: [
    'access:public_games',
  ],
};

export class CapabilityEngine {
  /**
   * Evalúa si un usuario o rol posee una capacidad específica.
   */
  static can(userOrRole: UserProfile | UserRole | null | undefined, capability: Capability): boolean {
    if (!userOrRole) return false;

    const role: UserRole = typeof userOrRole === 'string' ? userOrRole : userOrRole.role;
    
    if (typeof userOrRole === 'object' && userOrRole.capabilities?.length) {
      return userOrRole.capabilities.includes(capability);
    }

    const allowedCapabilities = DEFAULT_ROLE_CAPABILITIES[role] || [];
    return allowedCapabilities.includes(capability);
  }

  /**
   * Evalúa si el usuario cumple con TODAS las capacidades solicitadas.
   */
  static canAll(userOrRole: UserProfile | UserRole | null | undefined, capabilities: Capability[]): boolean {
    return capabilities.every((cap) => this.can(userOrRole, cap));
  }

  /**
   * Evalúa si el usuario cumple con AL MENOS UNA de las capacidades.
   */
  static canAny(userOrRole: UserProfile | UserRole | null | undefined, capabilities: Capability[]): boolean {
    return capabilities.some((cap) => this.can(userOrRole, cap));
  }
}