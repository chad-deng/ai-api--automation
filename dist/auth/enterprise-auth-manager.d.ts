/**
 * Enterprise Authentication Manager (US-023)
 * Handles OAuth2, SAML, custom headers, and other enterprise authentication patterns
 */
import { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';
export declare enum AuthenticationType {
    NONE = "none",
    BEARER = "bearer",
    API_KEY = "apikey",
    BASIC = "basic",
    OAUTH2 = "oauth2",
    OAUTH1 = "oauth1",
    SAML = "saml",
    JWT = "jwt",
    CUSTOM = "custom",
    MUTUAL_TLS = "mtls"
}
export interface AuthenticationCredentials {
    type: AuthenticationType;
    bearerToken?: string;
    apiKey?: {
        key: string;
        location: 'header' | 'query' | 'cookie';
        name: string;
    };
    basic?: {
        username: string;
        password: string;
    };
    oauth2?: {
        clientId: string;
        clientSecret?: string;
        tokenUrl: string;
        authUrl?: string;
        redirectUri?: string;
        scope?: string[];
        grantType: 'authorization_code' | 'client_credentials' | 'password' | 'refresh_token';
        refreshToken?: string;
        accessToken?: string;
        tokenType?: string;
        expiresAt?: Date;
    };
    oauth1?: {
        consumerKey: string;
        consumerSecret: string;
        token?: string;
        tokenSecret?: string;
        signatureMethod: 'HMAC-SHA1' | 'PLAINTEXT' | 'RSA-SHA1';
        realm?: string;
    };
    saml?: {
        idpUrl: string;
        spEntityId: string;
        certificate?: string;
        privateKey?: string;
        assertionConsumerServiceUrl?: string;
        nameIdFormat?: string;
        signRequest?: boolean;
        encryptAssertion?: boolean;
    };
    jwt?: {
        token?: string;
        secret?: string;
        algorithm?: string;
        issuer?: string;
        audience?: string;
        expiresIn?: string;
        privateKey?: string;
        publicKey?: string;
    };
    custom?: {
        headers?: Record<string, string>;
        parameters?: Record<string, string>;
        requestInterceptor?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
        responseInterceptor?: (response: AxiosResponse) => AxiosResponse;
    };
    mtls?: {
        cert: string;
        key: string;
        ca?: string;
        passphrase?: string;
    };
}
export interface AuthenticationContext {
    baseUrl: string;
    credentials: AuthenticationCredentials;
    httpClient?: AxiosInstance;
    tokenCache?: Map<string, TokenCacheEntry>;
    lastAuthentication?: Date;
    authenticationCount: number;
}
export interface TokenCacheEntry {
    accessToken: string;
    tokenType: string;
    expiresAt: Date;
    refreshToken?: string;
    scope?: string[];
}
export interface AuthenticationResult {
    success: boolean;
    error?: string;
    token?: string;
    tokenType?: string;
    expiresAt?: Date;
    headers?: Record<string, string>;
    parameters?: Record<string, string>;
}
export interface AuthenticationOptions {
    enableTokenCaching?: boolean;
    tokenCacheSize?: number;
    automaticRefresh?: boolean;
    refreshThreshold?: number;
    retryOnFailure?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    validateCertificates?: boolean;
    timeout?: number;
}
export declare class EnterpriseAuthManager extends EventEmitter {
    private contexts;
    private options;
    private globalTokenCache;
    constructor(options?: AuthenticationOptions);
    /**
     * Register authentication context
     */
    registerAuth(contextId: string, baseUrl: string, credentials: AuthenticationCredentials): Promise<void>;
    /**
     * Authenticate using the specified context
     */
    authenticate(contextId: string): Promise<AuthenticationResult>;
    /**
     * Get authenticated HTTP client for context
     */
    getAuthenticatedClient(contextId: string): Promise<AxiosInstance>;
    /**
     * Refresh authentication token
     */
    refreshToken(contextId: string): Promise<AuthenticationResult>;
    /**
     * Perform authentication based on type
     */
    private performAuthentication;
    /**
     * Bearer token authentication
     */
    private authenticateBearer;
    /**
     * API Key authentication
     */
    private authenticateApiKey;
    /**
     * Basic authentication
     */
    private authenticateBasic;
    /**
     * OAuth2 authentication
     */
    private authenticateOAuth2;
    /**
     * OAuth1 authentication
     */
    private authenticateOAuth1;
    /**
     * SAML authentication
     */
    private authenticateSAML;
    /**
     * JWT authentication
     */
    private authenticateJWT;
    /**
     * Custom authentication
     */
    private authenticateCustom;
    /**
     * Mutual TLS authentication
     */
    private authenticateMutualTLS;
    private getOAuth2ClientCredentialsToken;
    private getOAuth2AuthorizationCodeToken;
    private getOAuth2PasswordToken;
    private getOAuth2RefreshToken;
    private refreshOAuth2Token;
    private refreshJWTToken;
    private createHttpClient;
    private requiresInitialAuth;
    private needsTokenRefresh;
    private cacheToken;
    private generateOAuth1Headers;
    private generateSAMLRequest;
    private generateJWTToken;
    /**
     * Remove authentication context
     */
    removeAuth(contextId: string): void;
    /**
     * Get authentication contexts
     */
    getAuthContexts(): string[];
    /**
     * Get authentication status
     */
    getAuthStatus(contextId: string): any;
    private hasValidToken;
    /**
     * Clear token cache
     */
    clearTokenCache(): void;
    /**
     * Update authentication options
     */
    updateOptions(options: Partial<AuthenticationOptions>): void;
}
//# sourceMappingURL=enterprise-auth-manager.d.ts.map