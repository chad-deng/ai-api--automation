/**
 * Authentication Provider
 * Week 3 Sprint 1: Core authentication abstraction for API testing
 */
import { AuthConfiguration } from '../generator/test-generator';
export interface AuthCredentials {
    token?: string;
    apiKey?: string;
    username?: string;
    password?: string;
    clientId?: string;
    clientSecret?: string;
    scope?: string;
    tokenUrl?: string;
    refreshToken?: string;
}
export interface AuthHeaders {
    [key: string]: string;
}
export interface AuthResult {
    success: boolean;
    headers: AuthHeaders;
    error?: string;
    tokenExpiry?: Date;
}
export interface AuthProvider {
    authenticate(_credentials: AuthCredentials): Promise<AuthResult>;
    refresh?(_credentials: AuthCredentials): Promise<AuthResult>;
    validate(_headers: AuthHeaders): Promise<boolean>;
    getAuthHeaders(_credentials: AuthCredentials): Promise<AuthHeaders>;
}
export declare class BearerTokenProvider implements AuthProvider {
    authenticate(credentials: AuthCredentials): Promise<AuthResult>;
    validate(headers: AuthHeaders): Promise<boolean>;
    getAuthHeaders(credentials: AuthCredentials): Promise<AuthHeaders>;
}
export declare class ApiKeyProvider implements AuthProvider {
    private location;
    private name;
    constructor(location?: 'header' | 'query' | 'cookie', name?: string);
    authenticate(credentials: AuthCredentials): Promise<AuthResult>;
    validate(headers: AuthHeaders): Promise<boolean>;
    getAuthHeaders(credentials: AuthCredentials): Promise<AuthHeaders>;
}
export declare class OAuth2Provider implements AuthProvider {
    private tokenUrl;
    private grantType;
    constructor(tokenUrl: string, grantType?: 'client_credentials' | 'authorization_code' | 'refresh_token');
    authenticate(credentials: AuthCredentials): Promise<AuthResult>;
    refresh(credentials: AuthCredentials): Promise<AuthResult>;
    validate(headers: AuthHeaders): Promise<boolean>;
    getAuthHeaders(credentials: AuthCredentials): Promise<AuthHeaders>;
    private requestAccessToken;
}
export declare class BasicAuthProvider implements AuthProvider {
    authenticate(credentials: AuthCredentials): Promise<AuthResult>;
    validate(headers: AuthHeaders): Promise<boolean>;
    getAuthHeaders(credentials: AuthCredentials): Promise<AuthHeaders>;
}
export declare class AuthProviderFactory {
    static create(config: AuthConfiguration): AuthProvider;
}
//# sourceMappingURL=auth-provider.d.ts.map