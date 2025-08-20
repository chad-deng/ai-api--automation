/**
 * Auth Provider Tests
 * Week 3 Sprint 1: Comprehensive testing for authentication providers
 */

import { 
  BearerTokenProvider, 
  ApiKeyProvider, 
  OAuth2Provider, 
  BasicAuthProvider,
  AuthProviderFactory,
  AuthCredentials 
} from '../../src/auth/auth-provider';

describe('Auth Providers', () => {
  describe('BearerTokenProvider', () => {
    let provider: BearerTokenProvider;

    beforeEach(() => {
      provider = new BearerTokenProvider();
    });

    test('should authenticate with valid bearer token', async () => {
      const credentials: AuthCredentials = { token: 'test-token-123' };
      const result = await provider.authenticate(credentials);

      expect(result.success).toBe(true);
      expect(result.headers).toEqual({ 'Authorization': 'Bearer test-token-123' });
      expect(result.error).toBeUndefined();
    });

    test('should fail authentication without token', async () => {
      const credentials: AuthCredentials = {};
      const result = await provider.authenticate(credentials);

      expect(result.success).toBe(false);
      expect(result.headers).toEqual({});
      expect(result.error).toBe('Bearer token is required');
    });

    test('should validate bearer token headers', async () => {
      const validHeaders = { 'Authorization': 'Bearer token123' };
      const invalidHeaders = { 'Authorization': 'Basic token123' };
      const missingHeaders = {};

      expect(await provider.validate(validHeaders)).toBe(true);
      expect(await provider.validate(invalidHeaders)).toBe(false);
      expect(await provider.validate(missingHeaders)).toBe(false);
    });

    test('should get auth headers for valid token', async () => {
      const credentials: AuthCredentials = { token: 'test-token-456' };
      const headers = await provider.getAuthHeaders(credentials);

      expect(headers).toEqual({ 'Authorization': 'Bearer test-token-456' });
    });

    test('should throw error for missing token in getAuthHeaders', async () => {
      const credentials: AuthCredentials = {};
      
      await expect(provider.getAuthHeaders(credentials)).rejects.toThrow('Bearer token is required');
    });
  });

  describe('ApiKeyProvider', () => {
    test('should authenticate with API key in header', async () => {
      const provider = new ApiKeyProvider('header', 'X-API-Key');
      const credentials: AuthCredentials = { apiKey: 'test-api-key-123' };
      
      const result = await provider.authenticate(credentials);

      expect(result.success).toBe(true);
      expect(result.headers).toEqual({ 'X-API-Key': 'test-api-key-123' });
    });

    test('should use default header name', async () => {
      const provider = new ApiKeyProvider();
      const credentials: AuthCredentials = { apiKey: 'test-key' };
      
      const result = await provider.authenticate(credentials);

      expect(result.success).toBe(true);
      expect(result.headers).toEqual({ 'X-API-Key': 'test-key' });
    });

    test('should fail authentication without API key', async () => {
      const provider = new ApiKeyProvider();
      const credentials: AuthCredentials = {};
      
      const result = await provider.authenticate(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API key is required');
    });

    test('should validate API key headers', async () => {
      const provider = new ApiKeyProvider('header', 'X-Custom-Key');
      const validHeaders = { 'X-Custom-Key': 'key123' };
      const missingHeaders = {};

      expect(await provider.validate(validHeaders)).toBe(true);
      expect(await provider.validate(missingHeaders)).toBe(false);
    });

    test('should handle query location', async () => {
      const provider = new ApiKeyProvider('query', 'api_key');
      const credentials: AuthCredentials = { apiKey: 'query-key' };
      
      const headers = await provider.getAuthHeaders(credentials);

      expect(headers).toEqual({});
    });
  });

  describe('OAuth2Provider', () => {
    let provider: OAuth2Provider;

    beforeEach(() => {
      provider = new OAuth2Provider('https://api.example.com/oauth/token');
    });

    test('should authenticate with client credentials', async () => {
      const credentials: AuthCredentials = {
        clientId: 'test-client',
        clientSecret: 'test-secret'
      };
      
      const result = await provider.authenticate(credentials);

      expect(result.success).toBe(true);
      expect(result.headers.Authorization).toMatch(/^Bearer mock-oauth2-token-\d+$/);
      expect(result.tokenExpiry).toBeInstanceOf(Date);
    });

    test('should fail authentication without credentials', async () => {
      const credentials: AuthCredentials = {};
      
      const result = await provider.authenticate(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('OAuth2 client credentials are required');
    });

    test('should refresh token', async () => {
      const credentials: AuthCredentials = {
        refreshToken: 'refresh-token-123'
      };
      
      const result = await provider.refresh!(credentials);

      expect(result.success).toBe(true);
      expect(result.headers.Authorization).toMatch(/^Bearer mock-oauth2-token-\d+$/);
    });

    test('should fail refresh without refresh token', async () => {
      const credentials: AuthCredentials = {};
      
      const result = await provider.refresh!(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refresh token is required');
    });

    test('should validate OAuth2 token headers', async () => {
      const validHeaders = { 'Authorization': 'Bearer oauth2-token' };
      const invalidHeaders = { 'Authorization': 'Basic token' };

      expect(await provider.validate(validHeaders)).toBe(true);
      expect(await provider.validate(invalidHeaders)).toBe(false);
    });

    test('should get auth headers', async () => {
      const credentials: AuthCredentials = {
        clientId: 'test-client',
        clientSecret: 'test-secret'
      };
      
      const headers = await provider.getAuthHeaders(credentials);

      expect(headers.Authorization).toMatch(/^Bearer mock-oauth2-token-\d+$/);
    });
  });

  describe('BasicAuthProvider', () => {
    let provider: BasicAuthProvider;

    beforeEach(() => {
      provider = new BasicAuthProvider();
    });

    test('should authenticate with username and password', async () => {
      const credentials: AuthCredentials = {
        username: 'testuser',
        password: 'testpass'
      };
      
      const result = await provider.authenticate(credentials);

      expect(result.success).toBe(true);
      expect(result.headers.Authorization).toBe('Basic ' + Buffer.from('testuser:testpass').toString('base64'));
    });

    test('should fail authentication without credentials', async () => {
      const credentials: AuthCredentials = {};
      
      const result = await provider.authenticate(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Username and password are required for Basic Auth');
    });

    test('should validate Basic Auth headers', async () => {
      const validHeaders = { 'Authorization': 'Basic dGVzdDp0ZXN0' };
      const invalidHeaders = { 'Authorization': 'Bearer token' };

      expect(await provider.validate(validHeaders)).toBe(true);
      expect(await provider.validate(invalidHeaders)).toBe(false);
    });

    test('should get auth headers', async () => {
      const credentials: AuthCredentials = {
        username: 'user',
        password: 'pass'
      };
      
      const headers = await provider.getAuthHeaders(credentials);

      expect(headers.Authorization).toBe('Basic ' + Buffer.from('user:pass').toString('base64'));
    });

    test('should throw error for missing credentials in getAuthHeaders', async () => {
      const credentials: AuthCredentials = { username: 'user' };
      
      await expect(provider.getAuthHeaders(credentials)).rejects.toThrow('Username and password are required for Basic Auth');
    });
  });

  describe('AuthProviderFactory', () => {
    test('should create BearerTokenProvider', () => {
      const provider = AuthProviderFactory.create({ type: 'bearer' });
      expect(provider).toBeInstanceOf(BearerTokenProvider);
    });

    test('should create ApiKeyProvider', () => {
      const provider = AuthProviderFactory.create({ 
        type: 'apikey', 
        location: 'header', 
        name: 'X-Custom-Key' 
      });
      expect(provider).toBeInstanceOf(ApiKeyProvider);
    });

    test('should create OAuth2Provider', () => {
      const provider = AuthProviderFactory.create({ 
        type: 'oauth2', 
        tokenUrl: 'https://api.example.com/token' 
      });
      expect(provider).toBeInstanceOf(OAuth2Provider);
    });

    test('should create BasicAuthProvider', () => {
      const provider = AuthProviderFactory.create({ type: 'basic' });
      expect(provider).toBeInstanceOf(BasicAuthProvider);
    });

    test('should throw error for unsupported type', () => {
      expect(() => {
        AuthProviderFactory.create({ type: 'unsupported' as any });
      }).toThrow('Unsupported authentication type: unsupported');
    });
  });

  describe('Authentication Edge Cases', () => {
    test('should handle empty string token', async () => {
      const provider = new BearerTokenProvider();
      const credentials: AuthCredentials = { token: '' };
      
      const result = await provider.authenticate(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bearer token is required');
    });

    test('should handle special characters in credentials', async () => {
      const provider = new BasicAuthProvider();
      const credentials: AuthCredentials = {
        username: 'user@domain.com',
        password: 'p@ssw0rd!#$'
      };
      
      const result = await provider.authenticate(credentials);

      expect(result.success).toBe(true);
      expect(result.headers.Authorization).toBe('Basic ' + Buffer.from('user@domain.com:p@ssw0rd!#$').toString('base64'));
    });

    test('should handle very long API keys', async () => {
      const provider = new ApiKeyProvider();
      const longKey = 'a'.repeat(1000);
      const credentials: AuthCredentials = { apiKey: longKey };
      
      const result = await provider.authenticate(credentials);

      expect(result.success).toBe(true);
      expect(result.headers['X-API-Key']).toBe(longKey);
    });

    test('should handle OAuth2 with custom scope', async () => {
      const provider = new OAuth2Provider('https://api.example.com/token');
      const credentials: AuthCredentials = {
        clientId: 'client',
        clientSecret: 'secret',
        scope: 'read:users write:data admin:all'
      };
      
      const result = await provider.authenticate(credentials);

      expect(result.success).toBe(true);
      expect(result.headers.Authorization).toMatch(/^Bearer mock-oauth2-token-\d+$/);
    });
  });

  describe('Concurrent Authentication', () => {
    test('should handle multiple concurrent authentications', async () => {
      const provider = new BearerTokenProvider();
      const credentials1: AuthCredentials = { token: 'token1' };
      const credentials2: AuthCredentials = { token: 'token2' };
      const credentials3: AuthCredentials = { token: 'token3' };

      const results = await Promise.all([
        provider.authenticate(credentials1),
        provider.authenticate(credentials2),
        provider.authenticate(credentials3)
      ]);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      expect(results[0].headers.Authorization).toBe('Bearer token1');
      expect(results[1].headers.Authorization).toBe('Bearer token2');
      expect(results[2].headers.Authorization).toBe('Bearer token3');
    });

    test('should handle concurrent OAuth2 authentications', async () => {
      const provider = new OAuth2Provider('https://api.example.com/token');
      const baseCredentials = {
        clientId: 'client',
        clientSecret: 'secret'
      };

      const results = await Promise.all([
        provider.authenticate({ ...baseCredentials, scope: 'scope1' }),
        provider.authenticate({ ...baseCredentials, scope: 'scope2' }),
        provider.authenticate({ ...baseCredentials, scope: 'scope3' })
      ]);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.headers.Authorization).toMatch(/^Bearer mock-oauth2-token-\d+$/);
        expect(result.tokenExpiry).toBeInstanceOf(Date);
      });
    });
  });
});