export interface AccessTokenPayload {
    userId: string;
    username: string;
    role: string;
}
export interface RefreshTokenPayload {
    userId: string;
    tokenVersion: number;
}
export declare function signAccessToken(payload: AccessTokenPayload): string;
export declare function signRefreshToken(payload: RefreshTokenPayload): string;
export declare function verifyAccessToken(token: string): AccessTokenPayload;
export declare function verifyRefreshToken(token: string): RefreshTokenPayload;
