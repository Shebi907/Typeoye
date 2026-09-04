interface TokenPayload {
    userId: string;
    iat?: number;
    exp?: number;
}
export declare function signToken(userId: string): string;
export declare function verifyToken(token: string): TokenPayload;
export {};
//# sourceMappingURL=jwt.d.ts.map