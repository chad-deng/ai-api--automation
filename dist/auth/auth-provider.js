"use strict";
/**
 * Authentication Provider
 * Week 3 Sprint 1: Core authentication abstraction for API testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProviderFactory = exports.BasicAuthProvider = exports.OAuth2Provider = exports.ApiKeyProvider = exports.BearerTokenProvider = void 0;
class BearerTokenProvider {
    async authenticate(credentials) {
        if (!credentials.token) {
            return {
                success: false,
                headers: {},
                error: 'Bearer token is required'
            };
        }
        return {
            success: true,
            headers: {
                'Authorization': `Bearer ${credentials.token}`
            }
        };
    }
    async validate(headers) {
        return headers.Authorization?.startsWith('Bearer ') ?? false;
    }
    async getAuthHeaders(credentials) {
        if (!credentials.token) {
            throw new Error('Bearer token is required');
        }
        return {
            'Authorization': `Bearer ${credentials.token}`
        };
    }
}
exports.BearerTokenProvider = BearerTokenProvider;
class ApiKeyProvider {
    constructor(location = 'header', name = 'X-API-Key') {
        this.location = location;
        this.name = name;
    }
    async authenticate(credentials) {
        if (!credentials.apiKey) {
            return {
                success: false,
                headers: {},
                error: 'API key is required'
            };
        }
        const headers = {};
        if (this.location === 'header') {
            headers[this.name] = credentials.apiKey;
        }
        // Query and cookie handling would be implemented in the actual HTTP client
        return {
            success: true,
            headers
        };
    }
    async validate(headers) {
        return this.location === 'header' ?
            Boolean(headers[this.name]) :
            true; // Query/cookie validation would need request context
    }
    async getAuthHeaders(credentials) {
        if (!credentials.apiKey) {
            throw new Error('API key is required');
        }
        if (this.location === 'header') {
            return {
                [this.name]: credentials.apiKey
            };
        }
        return {};
    }
}
exports.ApiKeyProvider = ApiKeyProvider;
class OAuth2Provider {
    constructor(tokenUrl, grantType = 'client_credentials') {
        this.tokenUrl = tokenUrl;
        this.grantType = grantType;
    }
    async authenticate(credentials) {
        if (!credentials.clientId || !credentials.clientSecret) {
            return {
                success: false,
                headers: {},
                error: 'OAuth2 client credentials are required'
            };
        }
        try {
            // In a real implementation, this would make an HTTP request to the token endpoint
            const tokenResponse = await this.requestAccessToken(credentials);
            return {
                success: true,
                headers: {
                    'Authorization': `Bearer ${tokenResponse.access_token}`
                },
                tokenExpiry: new Date(Date.now() + (tokenResponse.expires_in * 1000))
            };
        }
        catch (error) {
            return {
                success: false,
                headers: {},
                error: error instanceof Error ? error.message : 'OAuth2 authentication failed'
            };
        }
    }
    async refresh(credentials) {
        if (!credentials.refreshToken) {
            return {
                success: false,
                headers: {},
                error: 'Refresh token is required'
            };
        }
        try {
            const tokenResponse = await this.requestAccessToken(credentials);
            return {
                success: true,
                headers: {
                    'Authorization': `Bearer ${tokenResponse.access_token}`
                },
                tokenExpiry: new Date(Date.now() + (tokenResponse.expires_in * 1000))
            };
        }
        catch (error) {
            return {
                success: false,
                headers: {},
                error: error instanceof Error ? error.message : 'Token refresh failed'
            };
        }
    }
    async validate(headers) {
        return headers.Authorization?.startsWith('Bearer ') ?? false;
    }
    async getAuthHeaders(credentials) {
        const authResult = await this.authenticate(credentials);
        if (!authResult.success) {
            throw new Error(authResult.error || 'Authentication failed');
        }
        return authResult.headers;
    }
    async requestAccessToken(credentials) {
        // Mock implementation - in production this would use fetch/axios
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    access_token: 'mock-oauth2-token-' + Date.now(),
                    token_type: 'Bearer',
                    expires_in: 3600,
                    scope: credentials.scope || 'api'
                });
            }, 100);
        });
    }
}
exports.OAuth2Provider = OAuth2Provider;
class BasicAuthProvider {
    async authenticate(credentials) {
        if (!credentials.username || !credentials.password) {
            return {
                success: false,
                headers: {},
                error: 'Username and password are required for Basic Auth'
            };
        }
        const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
        return {
            success: true,
            headers: {
                'Authorization': `Basic ${encoded}`
            }
        };
    }
    async validate(headers) {
        return headers.Authorization?.startsWith('Basic ') ?? false;
    }
    async getAuthHeaders(credentials) {
        if (!credentials.username || !credentials.password) {
            throw new Error('Username and password are required for Basic Auth');
        }
        const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
        return {
            'Authorization': `Basic ${encoded}`
        };
    }
}
exports.BasicAuthProvider = BasicAuthProvider;
class AuthProviderFactory {
    static create(config) {
        switch (config.type) {
            case 'bearer':
                return new BearerTokenProvider();
            case 'apikey':
                return new ApiKeyProvider(config.location || 'header', config.name || 'X-API-Key');
            case 'oauth2':
                return new OAuth2Provider(config.tokenUrl || 'https://api.example.com/oauth/token');
            case 'basic':
                return new BasicAuthProvider();
            default:
                throw new Error(`Unsupported authentication type: ${config.type}`);
        }
    }
}
exports.AuthProviderFactory = AuthProviderFactory;
//# sourceMappingURL=auth-provider.js.map