export type UserRole = 'user' | 'contest_admin' | 'super_admin';

export interface PublicUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  role: UserRole;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  totalBattles: number;
  createdAt: string;
}

export interface UserProfile extends PublicUser {
  email: string;
  bio: string | null;
}

export interface RatingHistoryEntry {
  rating: number;
  delta: number;
  battleId: string;
  createdAt: string;
}
