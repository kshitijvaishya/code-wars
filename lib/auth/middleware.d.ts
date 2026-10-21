import type { VercelRequest } from '@vercel/node';
export interface AuthenticatedUser {
    _id: string;
    username: string;
    email: string;
    role: string;
}
export declare function authenticate(req: VercelRequest): Promise<AuthenticatedUser | null>;
export declare function requireAdmin(user: AuthenticatedUser | null): boolean;
export declare function requireAuth(user: AuthenticatedUser | null): boolean;
