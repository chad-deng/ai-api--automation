"use strict";
/**
 * Enterprise Authentication Manager (US-023)
 * Handles OAuth2, SAML, custom headers, and other enterprise authentication patterns
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseAuthManager = exports.AuthenticationType = void 0;
const axios_1 = __importDefault(require("axios"));
const events_1 = require("events");
const fs_1 = require("fs");
const crypto_1 = __importDefault(require("crypto"));
var AuthenticationType;
(function (AuthenticationType) {
    AuthenticationType["NONE"] = "none";
    AuthenticationType["BEARER"] = "bearer";
    AuthenticationType["API_KEY"] = "apikey";
    AuthenticationType["BASIC"] = "basic";
    AuthenticationType["OAUTH2"] = "oauth2";
    AuthenticationType["OAUTH1"] = "oauth1";
    AuthenticationType["SAML"] = "saml";
    AuthenticationType["JWT"] = "jwt";
    AuthenticationType["CUSTOM"] = "custom";
    AuthenticationType["MUTUAL_TLS"] = "mtls";
})(AuthenticationType || (exports.AuthenticationType = AuthenticationType = {}));
class EnterpriseAuthManager extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.contexts = new Map();
        this.globalTokenCache = new Map();
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
    async registerAuth(contextId, baseUrl, credentials) {
        const httpClient = this.createHttpClient(baseUrl, credentials);
        const context = {
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
    async authenticate(contextId) {
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
            }
            else {
                this.emit('authFailure', { contextId, error: result.error });
            }
            return result;
        }
        catch (error) {
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
    async getAuthenticatedClient(contextId) {
        const context = this.contexts.get(contextId);
        if (!context) {
            throw new Error(`Authentication context not found: ${contextId}`);
        }
        // Check if token needs refresh
        if (this.needsTokenRefresh(context)) {
            await this.refreshToken(contextId);
        }
        return context.httpClient;
    }
    /**
     * Refresh authentication token
     */
    async refreshToken(contextId) {
        const context = this.contexts.get(contextId);
        if (!context) {
            throw new Error(`Authentication context not found: ${contextId}`);
        }
        const credentials = context.credentials;
        try {
            let result;
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
        }
        catch (error) {
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
    async performAuthentication(context) {
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
    authenticateBearer(context) {
        const { bearerToken } = context.credentials;
        if (!bearerToken) {
            return { success: false, error: 'Bearer token not provided' };
        }
        // Add bearer token to default headers
        context.httpClient.defaults.headers.common['Authorization'] = `Bearer ${bearerToken}`;
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
    authenticateApiKey(context) {
        const { apiKey } = context.credentials;
        if (!apiKey || !apiKey.key) {
            return { success: false, error: 'API key not provided' };
        }
        switch (apiKey.location) {
            case 'header':
                context.httpClient.defaults.headers.common[apiKey.name] = apiKey.key;
                return {
                    success: true,
                    headers: { [apiKey.name]: apiKey.key }
                };
            case 'query':
                // Add as default parameter
                context.httpClient.defaults.params = {
                    ...context.httpClient.defaults.params,
                    [apiKey.name]: apiKey.key
                };
                return {
                    success: true,
                    parameters: { [apiKey.name]: apiKey.key }
                };
            case 'cookie':
                context.httpClient.defaults.headers.common['Cookie'] = `${apiKey.name}=${apiKey.key}`;
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
    authenticateBasic(context) {
        const { basic } = context.credentials;
        if (!basic || !basic.username || !basic.password) {
            return { success: false, error: 'Basic auth credentials not provided' };
        }
        const token = Buffer.from(`${basic.username}:${basic.password}`).toString('base64');
        context.httpClient.defaults.headers.common['Authorization'] = `Basic ${token}`;
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
    async authenticateOAuth2(context) {
        const { oauth2 } = context.credentials;
        if (!oauth2 || !oauth2.clientId || !oauth2.tokenUrl) {
            return { success: false, error: 'OAuth2 configuration incomplete' };
        }
        try {
            let tokenResponse;
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
            context.httpClient.defaults.headers.common['Authorization'] = `${tokenType} ${accessToken}`;
            return {
                success: true,
                token: accessToken,
                tokenType,
                expiresAt: oauth2.expiresAt,
                headers: { 'Authorization': `${tokenType} ${accessToken}` }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `OAuth2 authentication failed: ${error instanceof Error ? error.message : error}`
            };
        }
    }
    /**
     * OAuth1 authentication
     */
    authenticateOAuth1(context) {
        const { oauth1 } = context.credentials;
        if (!oauth1 || !oauth1.consumerKey || !oauth1.consumerSecret) {
            return { success: false, error: 'OAuth1 configuration incomplete' };
        }
        // Add OAuth1 request interceptor
        context.httpClient.interceptors.request.use((config) => {
            const oauthHeaders = this.generateOAuth1Headers(config, oauth1);
            config.headers = { ...config.headers, ...oauthHeaders };
            return config;
        });
        return { success: true };
    }
    /**
     * SAML authentication
     */
    async authenticateSAML(context) {
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
        }
        catch (error) {
            return {
                success: false,
                error: `SAML authentication failed: ${error instanceof Error ? error.message : error}`
            };
        }
    }
    /**
     * JWT authentication
     */
    async authenticateJWT(context) {
        const { jwt } = context.credentials;
        if (!jwt) {
            return { success: false, error: 'JWT configuration not provided' };
        }
        try {
            let token;
            if (jwt.token) {
                // Use provided token
                token = jwt.token;
            }
            else if (jwt.secret || jwt.privateKey) {
                // Generate token
                token = this.generateJWTToken(jwt);
            }
            else {
                return { success: false, error: 'JWT token or signing credentials required' };
            }
            context.httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return {
                success: true,
                token,
                tokenType: 'Bearer',
                headers: { 'Authorization': `Bearer ${token}` }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `JWT authentication failed: ${error instanceof Error ? error.message : error}`
            };
        }
    }
    /**
     * Custom authentication
     */
    authenticateCustom(context) {
        const { custom } = context.credentials;
        if (!custom) {
            return { success: false, error: 'Custom authentication configuration not provided' };
        }
        // Apply custom headers
        if (custom.headers) {
            Object.assign(context.httpClient.defaults.headers.common, custom.headers);
        }
        // Apply custom parameters
        if (custom.parameters) {
            context.httpClient.defaults.params = {
                ...context.httpClient.defaults.params,
                ...custom.parameters
            };
        }
        // Add request interceptor
        if (custom.requestInterceptor) {
            context.httpClient.interceptors.request.use(custom.requestInterceptor);
        }
        // Add response interceptor
        if (custom.responseInterceptor) {
            context.httpClient.interceptors.response.use(custom.responseInterceptor);
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
    async authenticateMutualTLS(context) {
        const { mtls } = context.credentials;
        if (!mtls || !mtls.cert || !mtls.key) {
            return { success: false, error: 'Mutual TLS configuration incomplete' };
        }
        try {
            // Load certificates
            const cert = await fs_1.promises.readFile(mtls.cert, 'utf-8');
            const key = await fs_1.promises.readFile(mtls.key, 'utf-8');
            let ca;
            if (mtls.ca) {
                ca = await fs_1.promises.readFile(mtls.ca, 'utf-8');
            }
            // Update HTTP client with TLS configuration
            context.httpClient.defaults.httpsAgent = new (require('https').Agent)({
                cert,
                key,
                ca,
                passphrase: mtls.passphrase,
                rejectUnauthorized: this.options.validateCertificates
            });
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: `Mutual TLS setup failed: ${error instanceof Error ? error.message : error}`
            };
        }
    }
    // Helper methods for OAuth2 grant types
    async getOAuth2ClientCredentialsToken(oauth2) {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', oauth2.clientId);
        if (oauth2.clientSecret) {
            params.append('client_secret', oauth2.clientSecret);
        }
        if (oauth2.scope) {
            params.append('scope', oauth2.scope.join(' '));
        }
        return axios_1.default.post(oauth2.tokenUrl, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
    }
    async getOAuth2AuthorizationCodeToken(oauth2) {
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
        return axios_1.default.post(oauth2.tokenUrl, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
    }
    async getOAuth2PasswordToken(oauth2) {
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
        return axios_1.default.post(oauth2.tokenUrl, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
    }
    async getOAuth2RefreshToken(oauth2) {
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
        return axios_1.default.post(oauth2.tokenUrl, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
    }
    async refreshOAuth2Token(context) {
        const { oauth2 } = context.credentials;
        if (!oauth2?.refreshToken) {
            return { success: false, error: 'No refresh token available' };
        }
        oauth2.grantType = 'refresh_token';
        return this.authenticateOAuth2(context);
    }
    async refreshJWTToken(context) {
        // JWT tokens are typically regenerated rather than refreshed
        return this.authenticateJWT(context);
    }
    // Helper methods
    createHttpClient(baseUrl, credentials) {
        return axios_1.default.create({
            baseURL: baseUrl,
            timeout: this.options.timeout,
            validateStatus: (status) => status < 500 // Don't throw on 4xx errors
        });
    }
    requiresInitialAuth(type) {
        return [
            AuthenticationType.OAUTH2,
            AuthenticationType.SAML,
            AuthenticationType.JWT
        ].includes(type);
    }
    needsTokenRefresh(context) {
        if (!this.options.automaticRefresh)
            return false;
        const { oauth2, jwt } = context.credentials;
        if (oauth2?.expiresAt) {
            const threshold = this.options.refreshThreshold * 60 * 1000; // Convert to ms
            return oauth2.expiresAt.getTime() - Date.now() < threshold;
        }
        // Add JWT token refresh logic if needed
        return false;
    }
    cacheToken(contextId, result) {
        if (!result.token || !result.expiresAt)
            return;
        const entry = {
            accessToken: result.token,
            tokenType: result.tokenType || 'Bearer',
            expiresAt: result.expiresAt
        };
        this.globalTokenCache.set(contextId, entry);
        // Cleanup old entries if cache is full
        if (this.globalTokenCache.size > this.options.tokenCacheSize) {
            const oldestKey = this.globalTokenCache.keys().next().value;
            this.globalTokenCache.delete(oldestKey);
        }
    }
    generateOAuth1Headers(config, oauth1) {
        // Simplified OAuth1 signature generation
        // In production, use a proper OAuth1 library
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = crypto_1.default.randomBytes(16).toString('hex');
        const authHeader = `OAuth oauth_consumer_key="${oauth1.consumerKey}", oauth_timestamp="${timestamp}", oauth_nonce="${nonce}", oauth_signature_method="${oauth1.signatureMethod}"`;
        return {
            'Authorization': authHeader
        };
    }
    generateSAMLRequest(saml) {
        // Simplified SAML request generation
        // In production, use a proper SAML library
        return `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
      <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${saml.spEntityId}</saml:Issuer>
    </samlp:AuthnRequest>`;
    }
    generateJWTToken(jwt) {
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
            const signature = crypto_1.default
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
    removeAuth(contextId) {
        this.contexts.delete(contextId);
        this.globalTokenCache.delete(contextId);
        this.emit('authRemoved', { contextId });
    }
    /**
     * Get authentication contexts
     */
    getAuthContexts() {
        return Array.from(this.contexts.keys());
    }
    /**
     * Get authentication status
     */
    getAuthStatus(contextId) {
        const context = this.contexts.get(contextId);
        if (!context)
            return null;
        return {
            type: context.credentials.type,
            lastAuthentication: context.lastAuthentication,
            authenticationCount: context.authenticationCount,
            hasValidToken: this.hasValidToken(contextId)
        };
    }
    hasValidToken(contextId) {
        const cached = this.globalTokenCache.get(contextId);
        return cached ? cached.expiresAt > new Date() : false;
    }
    /**
     * Clear token cache
     */
    clearTokenCache() {
        this.globalTokenCache.clear();
        this.emit('tokenCacheCleared');
    }
    /**
     * Update authentication options
     */
    updateOptions(options) {
        this.options = { ...this.options, ...options };
        this.emit('optionsUpdated', this.options);
    }
}
exports.EnterpriseAuthManager = EnterpriseAuthManager;
//# sourceMappingURL=enterprise-auth-manager.js.map