// packages/growth/src/types/user.ts

export type GuestProfile = {
  isGuest: true;
  tempId: string;
  streakCount: number;
  createdOn: string;
};

export type RegisteredUserProfile = {
  isGuest: false;
  userId: string;
  email: string;
  tier: 'free' | 'premium';
  streakCount: number;
  subscriptionStatus?: 'active' | 'inactive';
};

export type UserProfile = GuestProfile | RegisteredUserProfile;