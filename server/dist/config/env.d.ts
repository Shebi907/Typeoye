export declare const googleOAuth: {
    clientId: string;
    clientSecret: string;
    readonly isConfigured: boolean;
};
export declare const env: {
    PORT: string;
    MONGODB_URI: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    CLIENT_URL: string;
    NODE_ENV: "development" | "production" | "test";
    EMAIL_TO: string;
    RESEND_FROM_EMAIL: string;
    GOOGLE_CLIENT_ID?: string | undefined;
    GOOGLE_CLIENT_SECRET?: string | undefined;
    EMAIL_USER?: string | undefined;
    EMAIL_PASS?: string | undefined;
    RESEND_API_KEY?: string | undefined;
};
export declare const mailerConfig: {
    user: string;
    pass: string;
    to: string;
    readonly isConfigured: boolean;
};
export declare const resendConfig: {
    readonly apiKey: string;
    readonly fromEmail: string;
};
//# sourceMappingURL=env.d.ts.map