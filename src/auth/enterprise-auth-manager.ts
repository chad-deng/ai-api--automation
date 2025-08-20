/**
 * Enterprise Authentication Manager (US-023)
 * Handles OAuth2, SAML, custom headers, and other enterprise authentication patterns
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import { URL } from 'url';

export enum AuthenticationType {
  NONE = 'none',
  BEARER = 'bearer',
  API_KEY = 'apikey',
  BASIC = 'basic',
  OAUTH2 = 'oauth2',
  OAUTH1 = 'oauth1',
  SAML = 'saml',
  JWT = 'jwt',
  CUSTOM = 'custom',
  MUTUAL_TLS = 'mtls'
}

export interface AuthenticationCredentials {
  type: AuthenticationType;
  
  // Bearer token authentication
  bearerToken?: string;
  
  // API Key authentication
  apiKey?: {
    key: string;
    location: 'header' | 'query' | 'cookie';
    name: string;
  };
  
  // Basic authentication
  basic?: {
    username: string;
    password: string;
  };
  
  // OAuth2 authentication
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
  
  // OAuth1 authentication
  oauth1?: {
    consumerKey: string;
    consumerSecret: string;
    token?: string;
    tokenSecret?: string;
    signatureMethod: 'HMAC-SHA1' | 'PLAINTEXT' | 'RSA-SHA1';
    realm?: string;
  };
  
  // SAML authentication
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
  
  // JWT authentication
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
  
  // Custom authentication
  custom?: {
    headers?: Record<string, string>;
    parameters?: Record<string, string>;
    requestInterceptor?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
    responseInterceptor?: (response: AxiosResponse) => AxiosResponse;
  };
  
  // Mutual TLS authentication
  mtls?: {
    cert: string; // Path to client certificate
    key: string;  // Path to private key
    ca?: string;  // Path to CA certificate
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
  refreshThreshold?: number; // Minutes before expiration to refresh
  retryOnFailure?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  validateCertificates?: boolean;
  timeout?: number;
}

export class EnterpriseAuthManager extends EventEmitter {
  private contexts: Map<string, AuthenticationContext> = new Map();
  private options: AuthenticationOptions;
  private globalTokenCache: Map<string, TokenCacheEntry> = new Map();

  constructor(options: AuthenticationOptions = {}) {
    super();
    
    this.options = {
      enableTokenCaching: true,
      tokenCacheSize: 100,
      automaticRefresh: true,
      refreshThreshold: 5, // 5 minutes
      retryOnFailure: true,
      maxRetries: 3,
      retryDelay: 1000,
      validateCertificates: true,
      timeout: 30000,
      ...options
    };
  }

  /**
   * Register authentication context
   */
  async registerAuth(
    contextId: string,
    baseUrl: string,
    credentials: AuthenticationCredentials
  ): Promise<void> {
    const httpClient = this.createHttpClient(baseUrl, credentials);
    
    const context: AuthenticationContext = {
      baseUrl,
      credentials,
      httpClient,
      tokenCache: new Map(),
      authenticationCount: 0
    };
    
    this.contexts.set(contextId, context);
    
    // Perform initial authentication if needed
    if (this.requiresInitialAuth(credentials.type)) {
      await this.authenticate(contextId);
    }
    
    this.emit('authRegistered', { contextId, type: credentials.type });
  }

  /**
   * Authenticate using the specified context
   */
  async authenticate(contextId: string): Promise<AuthenticationResult> {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`Authentication context not found: ${contextId}`);
    }
    
    try {
      const result = await this.performAuthentication(context);
      
      if (result.success) {
        context.lastAuthentication = new Date();
        context.authenticationCount++;
        
        // Cache token if applicable
        if (this.options.enableTokenCaching && result.token) {
          this.cacheToken(contextId, result);
        }
        
        this.emit('authSuccess', { contextId, result });
      } else {
        this.emit('authFailure', { contextId, error: result.error });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('authError', { contextId, error: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get authenticated HTTP client for context
   */
  async getAuthenticatedClient(contextId: string): Promise<AxiosInstance> {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`Authentication context not found: ${contextId}`);
    }
    
    // Check if token needs refresh
    if (this.needsTokenRefresh(context)) {
      await this.refreshToken(contextId);
    }
    
    return context.httpClient!;
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(contextId: string): Promise<AuthenticationResult> {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`Authentication context not found: ${contextId}`);
    }
    
    const credentials = context.credentials;
    
    try {
      let result: AuthenticationResult;
      
      switch (credentials.type) {
        case AuthenticationType.OAUTH2:
          result = await this.refreshOAuth2Token(context);
          break;
        case AuthenticationType.JWT:
          result = await this.refreshJWTToken(context);
          break;
        default:
          // Re-authenticate for other types
          result = await this.performAuthentication(context);
      }
      
      if (result.success && this.options.enableTokenCaching && result.token) {
        this.cacheToken(contextId, result);
      }
      
      this.emit('tokenRefreshed', { contextId, result });
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('tokenRefreshError', { contextId, error: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Perform authentication based on type
   */
  private async performAuthentication(context: AuthenticationContext): Promise<AuthenticationResult> {
    const { type } = context.credentials;
    
    switch (type) {
      case AuthenticationType.NONE:
        return { success: true };
        
      case AuthenticationType.BEARER:
        return this.authenticateBearer(context);
        
      case AuthenticationType.API_KEY:
        return this.authenticateApiKey(context);
        
      case AuthenticationType.BASIC:
        return this.authenticateBasic(context);
        
      case AuthenticationType.OAUTH2:
        return this.authenticateOAuth2(context);
        
      case AuthenticationType.OAUTH1:
        return this.authenticateOAuth1(context);
        
      case AuthenticationType.SAML:
        return this.authenticateSAML(context);
        
      case AuthenticationType.JWT:
        return this.authenticateJWT(context);
        
      case AuthenticationType.CUSTOM:
        return this.authenticateCustom(context);
        
      case AuthenticationType.MUTUAL_TLS:
        return this.authenticateMutualTLS(context);
        
      default:
        return {
          success: false,
          error: `Unsupported authentication type: ${type}`
        };
    }
  }

  /**
   * Bearer token authentication
   */
  private authenticateBearer(context: AuthenticationContext): AuthenticationResult {
    const { bearerToken } = context.credentials;
    
    if (!bearerToken) {
      return { success: false, error: 'Bearer token not provided' };
    }
    
    // Add bearer token to default headers
    context.httpClient!.defaults.headers.common['Authorization'] = `Bearer ${bearerToken}`;
    
    return {
      success: true,
      token: bearerToken,
      tokenType: 'Bearer',
      headers: { 'Authorization': `Bearer ${bearerToken}` }
    };
  }

  /**
   * API Key authentication
   */
  private authenticateApiKey(context: AuthenticationContext): AuthenticationResult {
    const { apiKey } = context.credentials;
    
    if (!apiKey || !apiKey.key) {
      return { success: false, error: 'API key not provided' };
    }
    
    switch (apiKey.location) {
      case 'header':
        context.httpClient!.defaults.headers.common[apiKey.name] = apiKey.key;
        return {
          success: true,
          headers: { [apiKey.name]: apiKey.key }
        };
        
      case 'query':
        // Add as default parameter
        context.httpClient!.defaults.params = {
          ...context.httpClient!.defaults.params,
          [apiKey.name]: apiKey.key
        };
        return {
          success: true,
          parameters: { [apiKey.name]: apiKey.key }
        };
        
      case 'cookie':
        context.httpClient!.defaults.headers.common['Cookie'] = `${apiKey.name}=${apiKey.key}`;
        return {
          success: true,
          headers: { 'Cookie': `${apiKey.name}=${apiKey.key}` }
        };
        
      default:
        return { success: false, error: 'Invalid API key location' };
    }
  }

  /**
   * Basic authentication
   */
  private authenticateBasic(context: AuthenticationContext): AuthenticationResult {
    const { basic } = context.credentials;
    
    if (!basic || !basic.username || !basic.password) {
      return { success: false, error: 'Basic auth credentials not provided' };
    }
    
    const token = Buffer.from(`${basic.username}:${basic.password}`).toString('base64');
    context.httpClient!.defaults.headers.common['Authorization'] = `Basic ${token}`;
    
    return {
      success: true,
      token,
      tokenType: 'Basic',
      headers: { 'Authorization': `Basic ${token}` }
    };
  }

  /**
   * OAuth2 authentication
   */
  private async authenticateOAuth2(context: AuthenticationContext): Promise<AuthenticationResult> {
    const { oauth2 } = context.credentials;
    
    if (!oauth2 || !oauth2.clientId || !oauth2.tokenUrl) {
      return { success: false, error: 'OAuth2 configuration incomplete' };
    }
    
    try {
      let tokenResponse: AxiosResponse;
      
      switch (oauth2.grantType) {
        case 'client_credentials':
          tokenResponse = await this.getOAuth2ClientCredentialsToken(oauth2);
          break;
        case 'authorization_code':
          tokenResponse = await this.getOAuth2AuthorizationCodeToken(oauth2);
          break;
        case 'password':
          tokenResponse = await this.getOAuth2PasswordToken(oauth2);
          break;
        case 'refresh_token':
          tokenResponse = await this.getOAuth2RefreshToken(oauth2);
          break;
        default:
          return { success: false, error: `Unsupported grant type: ${oauth2.grantType}` };
      }
      
      const tokenData = tokenResponse.data;
      const accessToken = tokenData.access_token;
      const tokenType = tokenData.token_type || 'Bearer';
      const expiresIn = tokenData.expires_in;
      
      // Update context credentials
      oauth2.accessToken = accessToken;
      oauth2.tokenType = tokenType;
      
      if (expiresIn) {
        oauth2.expiresAt = new Date(Date.now() + (expiresIn * 1000));
      }
      
      if (tokenData.refresh_token) {
        oauth2.refreshToken = tokenData.refresh_token;
      }
      
      // Add token to HTTP client
      context.httpClient!.defaults.headers.common['Authorization'] = `${tokenType} ${accessToken}`;
      
      return {
        success: true,
        token: accessToken,
        tokenType,
        expiresAt: oauth2.expiresAt,
        headers: { 'Authorization': `${tokenType} ${accessToken}` }
      };
      
    } catch (error) {
      return {
        success: false,
        error: `OAuth2 authentication failed: ${error instanceof Error ? error.message : error}`
      };
    }
  }

  /**
   * OAuth1 authentication
   */
  private authenticateOAuth1(context: AuthenticationContext): AuthenticationResult {
    const { oauth1 } = context.credentials;
    
    if (!oauth1 || !oauth1.consumerKey || !oauth1.consumerSecret) {
      return { success: false, error: 'OAuth1 configuration incomplete' };
    }
    
    // Add OAuth1 request interceptor
    context.httpClient!.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const oauthHeaders = this.generateOAuth1Headers(config, oauth1);
      config.headers = { ...config.headers, ...oauthHeaders };
      return config;
    });
    
    return { success: true };
  }

  /**
   * SAML authentication
   */
  private async authenticateSAML(context: AuthenticationContext): Promise<AuthenticationResult> {
    const { saml } = context.credentials;
    
    if (!saml || !saml.idpUrl || !saml.spEntityId) {
      return { success: false, error: 'SAML configuration incomplete' };
    }
    
    try {
      // Generate SAML authentication request
      const samlRequest = this.generateSAMLRequest(saml);
      
      // This is a simplified implementation
      // In production, you would redirect to IdP and handle the response
      console.warn('SAML authentication requires manual implementation for your IdP');
      
      return {
        success: false,
        error: 'SAML authentication requires manual implementation'
      };
      
    } catch (error) {
      return {
        success: false,
        error: `SAML authentication failed: ${error instanceof Error ? error.message : error}`
      };
    }
  }

  /**
   * JWT authentication
   */
  private async authenticateJWT(context: AuthenticationContext): Promise<AuthenticationResult> {
    const { jwt } = context.credentials;
    
    if (!jwt) {
      return { success: false, error: 'JWT configuration not provided' };
    }
    
    try {
      let token: string;
      
      if (jwt.token) {
        // Use provided token
        token = jwt.token;
      } else if (jwt.secret || jwt.privateKey) {
        // Generate token
        token = this.generateJWTToken(jwt);
      } else {
        return { success: false, error: 'JWT token or signing credentials required' };
      }
      
      context.httpClient!.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return {
        success: true,
        token,
        tokenType: 'Bearer',
        headers: { 'Authorization': `Bearer ${token}` }
      };
      
    } catch (error) {
      return {
        success: false,
        error: `JWT authentication failed: ${error instanceof Error ? error.message : error}`
      };
    }
  }

  /**
   * Custom authentication
   */
  private authenticateCustom(context: AuthenticationContext): AuthenticationResult {
    const { custom } = context.credentials;
    
    if (!custom) {
      return { success: false, error: 'Custom authentication configuration not provided' };
    }
    
    // Apply custom headers
    if (custom.headers) {
      Object.assign(context.httpClient!.defaults.headers.common, custom.headers);
    }
    
    // Apply custom parameters
    if (custom.parameters) {
      context.httpClient!.defaults.params = {
        ...context.httpClient!.defaults.params,
        ...custom.parameters
      };
    }
    
    // Add request interceptor
    if (custom.requestInterceptor) {
      context.httpClient!.interceptors.request.use(custom.requestInterceptor);
    }
    
    // Add response interceptor
    if (custom.responseInterceptor) {
      context.httpClient!.interceptors.response.use(custom.responseInterceptor);
    }
    
    return {
      success: true,
      headers: custom.headers,
      parameters: custom.parameters
    };
  }

  /**
   * Mutual TLS authentication
   */
  private async authenticateMutualTLS(context: AuthenticationContext): Promise<AuthenticationResult> {
    const { mtls } = context.credentials;
    
    if (!mtls || !mtls.cert || !mtls.key) {
      return { success: false, error: 'Mutual TLS configuration incomplete' };
    }
    
    try {
      // Load certificates
      const cert = await fs.readFile(mtls.cert, 'utf-8');
      const key = await fs.readFile(mtls.key, 'utf-8');
      let ca: string | undefined;
      
      if (mtls.ca) {
        ca = await fs.readFile(mtls.ca, 'utf-8');
      }
      
      // Update HTTP client with TLS configuration
      context.httpClient!.defaults.httpsAgent = new (require('https').Agent)({
        cert,
        key,
        ca,
        passphrase: mtls.passphrase,
        rejectUnauthorized: this.options.validateCertificates
      });
      
      return { success: true };
      
    } catch (error) {
      return {
        success: false,
        error: `Mutual TLS setup failed: ${error instanceof Error ? error.message : error}`
      };
    }
  }

  // Helper methods for OAuth2 grant types
  private async getOAuth2ClientCredentialsToken(oauth2: any): Promise<AxiosResponse> {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', oauth2.clientId);
    
    if (oauth2.clientSecret) {
      params.append('client_secret', oauth2.clientSecret);
    }
    
    if (oauth2.scope) {
      params.append('scope', oauth2.scope.join(' '));
    }
    
    return axios.post(oauth2.tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  }

  private async getOAuth2AuthorizationCodeToken(oauth2: any): Promise<AxiosResponse> {
    if (!oauth2.authorizationCode) {
      throw new Error('Authorization code required for authorization_code grant');
    }
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', oauth2.authorizationCode);
    params.append('client_id', oauth2.clientId);
    
    if (oauth2.clientSecret) {
      params.append('client_secret', oauth2.clientSecret);
    }
    
    if (oauth2.redirectUri) {
      params.append('redirect_uri', oauth2.redirectUri);
    }
    
    return axios.post(oauth2.tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  }

  private async getOAuth2PasswordToken(oauth2: any): Promise<AxiosResponse> {
    if (!oauth2.username || !oauth2.password) {
      throw new Error('Username and password required for password grant');
    }
    
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', oauth2.username);
    params.append('password', oauth2.password);
    params.append('client_id', oauth2.clientId);
    
    if (oauth2.clientSecret) {
      params.append('client_secret', oauth2.clientSecret);
    }
    
    if (oauth2.scope) {
      params.append('scope', oauth2.scope.join(' '));
    }
    
    return axios.post(oauth2.tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  }

  private async getOAuth2RefreshToken(oauth2: any): Promise<AxiosResponse> {
    if (!oauth2.refreshToken) {
      throw new Error('Refresh token required for refresh_token grant');
    }
    
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', oauth2.refreshToken);
    params.append('client_id', oauth2.clientId);
    
    if (oauth2.clientSecret) {
      params.append('client_secret', oauth2.clientSecret);
    }
    
    return axios.post(oauth2.tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  }

  private async refreshOAuth2Token(context: AuthenticationContext): Promise<AuthenticationResult> {
    const { oauth2 } = context.credentials;
    
    if (!oauth2?.refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }
    
    oauth2.grantType = 'refresh_token';
    return this.authenticateOAuth2(context);
  }

  private async refreshJWTToken(context: AuthenticationContext): Promise<AuthenticationResult> {
    // JWT tokens are typically regenerated rather than refreshed
    return this.authenticateJWT(context);
  }

  // Helper methods
  private createHttpClient(baseUrl: string, credentials: AuthenticationCredentials): AxiosInstance {
    return axios.create({
      baseURL: baseUrl,
      timeout: this.options.timeout,
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });
  }

  private requiresInitialAuth(type: AuthenticationType): boolean {
    return [
      AuthenticationType.OAUTH2,
      AuthenticationType.SAML,
      AuthenticationType.JWT
    ].includes(type);
  }

  private needsTokenRefresh(context: AuthenticationContext): boolean {
    if (!this.options.automaticRefresh) return false;
    
    const { oauth2, jwt } = context.credentials;
    
    if (oauth2?.expiresAt) {
      const threshold = this.options.refreshThreshold! * 60 * 1000; // Convert to ms
      return oauth2.expiresAt.getTime() - Date.now() < threshold;
    }
    
    // Add JWT token refresh logic if needed
    
    return false;
  }

  private cacheToken(contextId: string, result: AuthenticationResult): void {
    if (!result.token || !result.expiresAt) return;
    
    const entry: TokenCacheEntry = {
      accessToken: result.token,
      tokenType: result.tokenType || 'Bearer',
      expiresAt: result.expiresAt
    };
    
    this.globalTokenCache.set(contextId, entry);
    
    // Cleanup old entries if cache is full
    if (this.globalTokenCache.size > this.options.tokenCacheSize!) {
      const oldestKey = this.globalTokenCache.keys().next().value;
      this.globalTokenCache.delete(oldestKey);
    }
  }

  private generateOAuth1Headers(config: any, oauth1: any): any {
    // Simplified OAuth1 signature generation
    // In production, use a proper OAuth1 library
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');
    
    const authHeader = `OAuth oauth_consumer_key="${oauth1.consumerKey}", oauth_timestamp="${timestamp}", oauth_nonce="${nonce}", oauth_signature_method="${oauth1.signatureMethod}"`;
    
    return {
      'Authorization': authHeader
    };
  }

  private generateSAMLRequest(saml: any): string {
    // Simplified SAML request generation
    // In production, use a proper SAML library
    return `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
      <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${saml.spEntityId}</saml:Issuer>
    </samlp:AuthnRequest>`;
  }

  private generateJWTToken(jwt: any): string {
    // Simplified JWT generation
    // In production, use a proper JWT library like jsonwebtoken
    const header = { alg: jwt.algorithm || 'HS256', typ: 'JWT' };
    const payload = {
      iss: jwt.issuer,
      aud: jwt.audience,
      exp: Math.floor(Date.now() / 1000) + (jwt.expiresIn || 3600),
      iat: Math.floor(Date.now() / 1000)
    };
    
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    if (jwt.secret) {
      const signature = crypto
        .createHmac('sha256', jwt.secret)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');
      
      return `${headerB64}.${payloadB64}.${signature}`;
    }
    
    throw new Error('JWT signing not implemented for this key type');
  }

  /**
   * Remove authentication context
   */
  removeAuth(contextId: string): void {
    this.contexts.delete(contextId);
    this.globalTokenCache.delete(contextId);
    this.emit('authRemoved', { contextId });
  }

  /**
   * Get authentication contexts
   */
  getAuthContexts(): string[] {
    return Array.from(this.contexts.keys());
  }

  /**
   * Get authentication status
   */
  getAuthStatus(contextId: string): any {
    const context = this.contexts.get(contextId);
    if (!context) return null;
    
    return {
      type: context.credentials.type,
      lastAuthentication: context.lastAuthentication,
      authenticationCount: context.authenticationCount,
      hasValidToken: this.hasValidToken(contextId)
    };
  }

  private hasValidToken(contextId: string): boolean {
    const cached = this.globalTokenCache.get(contextId);
    return cached ? cached.expiresAt > new Date() : false;
  }

  /**
   * Clear token cache
   */
  clearTokenCache(): void {
    this.globalTokenCache.clear();
    this.emit('tokenCacheCleared');
  }

  /**
   * Update authentication options
   */
  updateOptions(options: Partial<AuthenticationOptions>): void {
    this.options = { ...this.options, ...options };
    this.emit('optionsUpdated', this.options);
  }
}