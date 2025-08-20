/**
 * API Client Tests
 * Tests for HTTP client used in generated tests
 */

import { ApiClient, ApiError, createApiClient, AuthConfig } from '../../../src/generator/helpers/api-client';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiClient', () => {
  let apiClient: ApiClient;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    apiClient = new ApiClient({
      baseURL: 'https://api.example.com',
      timeout: 5000
    });
    mockFetch.mockReset();
  });

  describe('Configuration', () => {
    test('should initialize with default configuration', () => {
      const config = apiClient.getConfig();
      expect(config.baseURL).toBe('https://api.example.com');
      expect(config.timeout).toBe(5000);
    });

    test('should merge custom headers', () => {
      const client = new ApiClient({
        baseURL: 'https://api.example.com',
        headers: { 'X-Custom': 'value' }
      });
      
      const config = client.getConfig();
      expect(config.headers).toEqual({ 'X-Custom': 'value' });
    });

    test('should update base URL', () => {
      apiClient.updateBaseURL('https://new-api.example.com');
      expect(apiClient.getConfig().baseURL).toBe('https://new-api.example.com');
    });
  });

  describe('Authentication', () => {
    test('should setup bearer token authentication', () => {
      const auth: AuthConfig = {
        type: 'bearer',
        token: 'test-token'
      };
      
      apiClient.updateAuth(auth);
      expect(apiClient.getConfig().auth).toEqual(auth);
    });

    test('should setup API key authentication', () => {
      const auth: AuthConfig = {
        type: 'apikey',
        apiKey: 'test-key',
        apiKeyHeader: 'X-API-Key'
      };
      
      apiClient.updateAuth(auth);
      expect(apiClient.getConfig().auth).toEqual(auth);
    });

    test('should setup basic authentication', () => {
      const auth: AuthConfig = {
        type: 'basic',
        username: 'user',
        password: 'pass'
      };
      
      apiClient.updateAuth(auth);
      expect(apiClient.getConfig().auth).toEqual(auth);
    });

    test('should setup OAuth2 authentication', () => {
      const auth: AuthConfig = {
        type: 'oauth2',
        token: 'oauth-token'
      };
      
      apiClient.updateAuth(auth);
      expect(apiClient.getConfig().auth).toEqual(auth);
    });
  });

  describe('HTTP Methods', () => {
    test('should make GET requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue('{"data": "test"}')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const response = await apiClient.get('/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        })
      );
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'test' });
    });

    test('should make POST requests with data', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue('{"id": 1}')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const testData = { name: 'John', email: 'john@example.com' };
      const response = await apiClient.post('/users', testData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(testData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        })
      );
      
      expect(response.status).toBe(201);
      expect(response.data).toEqual({ id: 1 });
    });

    test('should make PUT requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue('{"updated": true}')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const testData = { name: 'Updated Name' };
      const response = await apiClient.put('/users/1', testData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(testData)
        })
      );
      
      expect(response.data).toEqual({ updated: true });
    });

    test('should make PATCH requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue('{"patched": true}')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const testData = { email: 'newemail@example.com' };
      const response = await apiClient.patch('/users/1', testData);

      expect(response.data).toEqual({ patched: true });
    });

    test('should make DELETE requests', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Headers(),
        text: jest.fn().mockResolvedValue(''),
        blob: jest.fn().mockResolvedValue(new Blob())
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const response = await apiClient.delete('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
      
      expect(response.status).toBe(204);
    });

    test('should make HEAD requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-length': '1234' }),
        text: jest.fn().mockResolvedValue(''),
        blob: jest.fn().mockResolvedValue(new Blob())
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const response = await apiClient.head('/users/1');
      
      expect(response.status).toBe(200);
    });

    test('should make OPTIONS requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'allow': 'GET,POST,PUT,DELETE' }),
        text: jest.fn().mockResolvedValue(''),
        blob: jest.fn().mockResolvedValue(new Blob())
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const response = await apiClient.options('/users');
      
      expect(response.status).toBe(200);
    });
  });

  describe('Query Parameters', () => {
    test('should handle query parameters in GET requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue('[]')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await apiClient.get('/users', { 
        params: { page: 1, limit: 10, active: true } 
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users?page=1&limit=10&active=true',
        expect.any(Object)
      );
    });

    test('should handle null and undefined query parameters', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue('[]')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await apiClient.get('/users', { 
        params: { page: 1, filter: null, search: undefined, active: true } 
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users?page=1&active=true',
        expect.any(Object)
      );
    });
  });

  describe('Response Parsing', () => {
    test('should parse JSON responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue('{"message": "success"}')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const response = await apiClient.get('/test');
      
      expect(response.data).toEqual({ message: 'success' });
    });

    test('should parse text responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: jest.fn().mockResolvedValue('plain text response')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const response = await apiClient.get('/test');
      
      expect(response.data).toBe('plain text response');
    });

    test('should handle empty JSON responses', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue('')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const response = await apiClient.get('/test');
      
      expect(response.data).toBe(null);
    });

    test('should parse response headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json',
          'x-custom-header': 'custom-value'
        }),
        text: jest.fn().mockResolvedValue('{}')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const response = await apiClient.get('/test');
      
      expect(response.headers['content-type']).toBe('application/json');
      expect(response.headers['x-custom-header']).toBe('custom-value');
    });
  });

  describe('Error Handling', () => {
    test('should handle fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });

    test('should handle timeout errors', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('AbortError');
            error.name = 'AbortError';
            reject(error);
          }, 50);
        })
      );

      const client = new ApiClient({
        baseURL: 'https://api.example.com',
        timeout: 100
      });

      await expect(client.get('/test')).rejects.toThrow('Request timeout');
    });

    test('should create ApiError instances', () => {
      const error = new ApiError('Test error', 500, { url: '/test' }, 1000);
      
      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(500);
      expect(error.time).toBe(1000);
      expect(error.config?.url).toBe('/test');
    });
  });

  describe('Performance Tracking', () => {
    test('should track request time', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue('{}')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const response = await apiClient.get('/test');
      
      expect(response.time).toBeDefined();
      expect(typeof response.time).toBe('number');
      expect(response.time!).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Factory Function', () => {
    test('should create ApiClient instance using factory', () => {
      const client = createApiClient({
        baseURL: 'https://factory.example.com'
      });
      
      expect(client).toBeInstanceOf(ApiClient);
      expect(client.getConfig().baseURL).toBe('https://factory.example.com');
    });
  });

  describe('Custom Configuration', () => {
    test('should handle custom headers in requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue('{}')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await apiClient.get('/test', {
        headers: { 'X-Request-ID': '12345' }
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Request-ID': '12345',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        })
      );
    });

    test('should handle absolute URLs', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue('{}')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await apiClient.get('https://external-api.example.com/data');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://external-api.example.com/data',
        expect.any(Object)
      );
    });
  });
});