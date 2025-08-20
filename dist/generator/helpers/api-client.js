"use strict";
/**
 * API Client Helper for Generated Tests
 * Week 4 Sprint 1: Enhanced HTTP client with Week 3 authentication integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.ApiClient = void 0;
exports.createApiClient = createApiClient;
class ApiClient {
    constructor(config) {
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        this.config = {
            timeout: 5000,
            ...config
        };
        // Setup authentication headers
        if (this.config.auth) {
            this.setupAuth(this.config.auth);
        }
        // Merge custom headers
        if (this.config.headers) {
            this.defaultHeaders = { ...this.defaultHeaders, ...this.config.headers };
        }
    }
    /**
     * GET request
     */
    async get(url, config) {
        return this.request({ ...config, method: 'GET', url });
    }
    /**
     * POST request
     */
    async post(url, data, config) {
        return this.request({ ...config, method: 'POST', url, data });
    }
    /**
     * PUT request
     */
    async put(url, data, config) {
        return this.request({ ...config, method: 'PUT', url, data });
    }
    /**
     * PATCH request
     */
    async patch(url, data, config) {
        return this.request({ ...config, method: 'PATCH', url, data });
    }
    /**
     * DELETE request
     */
    async delete(url, config) {
        return this.request({ ...config, method: 'DELETE', url });
    }
    /**
     * HEAD request
     */
    async head(url, config) {
        return this.request({ ...config, method: 'HEAD', url });
    }
    /**
     * OPTIONS request
     */
    async options(url, config) {
        return this.request({ ...config, method: 'OPTIONS', url });
    }
    /**
     * Core request method
     */
    async request(config) {
        const startTime = performance.now();
        try {
            const requestConfig = this.buildRequestConfig(config);
            const response = await this.executeRequest(requestConfig);
            const endTime = performance.now();
            return {
                ...response,
                time: endTime - startTime,
                config: requestConfig
            };
        }
        catch (error) {
            const endTime = performance.now();
            if (error instanceof ApiError) {
                error.time = endTime - startTime;
                throw error;
            }
            throw new ApiError(error instanceof Error ? error.message : 'Request failed', 0, config, endTime - startTime);
        }
    }
    /**
     * Build request configuration
     */
    buildRequestConfig(config) {
        const url = this.buildUrl(config.url || '', config.params);
        const headers = { ...this.defaultHeaders, ...config.headers };
        const timeout = config.timeout || this.config.timeout;
        return {
            ...config,
            url,
            headers,
            timeout
        };
    }
    /**
     * Build complete URL with query parameters
     */
    buildUrl(path, params) {
        let url = path.startsWith('http') ? path : `${this.config.baseURL}${path}`;
        if (params && Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });
            const queryString = searchParams.toString();
            if (queryString) {
                url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
            }
        }
        return url;
    }
    /**
     * Execute HTTP request using fetch API
     */
    async executeRequest(config) {
        const { url, method = 'GET', headers, data, timeout } = config;
        const fetchOptions = {
            method,
            headers: headers,
        };
        // Add request body for non-GET requests
        if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            if (typeof data === 'object') {
                fetchOptions.body = JSON.stringify(data);
            }
            else {
                fetchOptions.body = data;
            }
        }
        // Add timeout support
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        fetchOptions.signal = controller.signal;
        try {
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);
            // Parse response
            const responseData = await this.parseResponse(response);
            const responseHeaders = this.parseHeaders(response.headers);
            return {
                data: responseData,
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
                config: config
            };
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new ApiError('Request timeout', 0, config);
            }
            throw error;
        }
    }
    /**
     * Parse response body
     */
    async parseResponse(response) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        }
        else if (contentType.includes('text/')) {
            return response.text();
        }
        else {
            return response.blob();
        }
    }
    /**
     * Parse response headers
     */
    parseHeaders(headers) {
        const result = {};
        headers.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }
    /**
     * Setup authentication - Enhanced for Week 3 integration
     */
    setupAuth(auth) {
        switch (auth.type) {
            case 'bearer':
                if (auth.token) {
                    this.defaultHeaders['Authorization'] = `Bearer ${auth.token}`;
                }
                break;
            case 'apikey':
                if (auth.apiKey) {
                    const headerName = auth.apiKeyHeader || 'X-API-Key';
                    this.defaultHeaders[headerName] = auth.apiKey;
                }
                break;
            case 'basic':
                if (auth.username && auth.password) {
                    const credentials = btoa(`${auth.username}:${auth.password}`);
                    this.defaultHeaders['Authorization'] = `Basic ${credentials}`;
                }
                break;
            case 'oauth2':
                // For OAuth2, we expect the token to be already obtained
                if (auth.token) {
                    this.defaultHeaders['Authorization'] = `Bearer ${auth.token}`;
                }
                break;
        }
    }
    /**
     * Update authentication - Enhanced for dynamic auth updates
     */
    updateAuth(auth) {
        // Clear existing auth headers
        delete this.defaultHeaders['Authorization'];
        Object.keys(this.defaultHeaders).forEach(key => {
            if (key.toLowerCase().includes('api-key') || key.toLowerCase().includes('x-api')) {
                delete this.defaultHeaders[key];
            }
        });
        this.config.auth = auth;
        this.setupAuth(auth);
    }
    /**
     * Clear authentication
     */
    clearAuth() {
        delete this.config.auth;
        delete this.defaultHeaders['Authorization'];
        Object.keys(this.defaultHeaders).forEach(key => {
            if (key.toLowerCase().includes('api-key') || key.toLowerCase().includes('x-api')) {
                delete this.defaultHeaders[key];
            }
        });
    }
    /**
     * Test authentication by making a simple request
     */
    async testAuth(testEndpoint = '/health') {
        try {
            const response = await this.get(testEndpoint);
            return {
                success: true,
                status: response.status,
                headers: response.headers
            };
        }
        catch (error) {
            return {
                success: false,
                status: error instanceof ApiError ? error.status : 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Update base URL
     */
    updateBaseURL(baseURL) {
        this.config.baseURL = baseURL;
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
exports.ApiClient = ApiClient;
/**
 * Custom API Error class
 */
class ApiError extends Error {
    constructor(message, status, config, time, response) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.config = config;
        this.time = time;
        this.response = response;
    }
}
exports.ApiError = ApiError;
/**
 * Create a configured API client instance
 */
function createApiClient(config) {
    return new ApiClient(config);
}
/**
 * Default export
 */
exports.default = ApiClient;
//# sourceMappingURL=api-client.js.map