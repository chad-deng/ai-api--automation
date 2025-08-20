/**
 * API Client Helper for Generated Tests
 * Week 4 Sprint 1: Enhanced HTTP client with Week 3 authentication integration
 */
export interface ApiClientConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
    auth?: AuthConfig;
}
export interface AuthConfig {
    type: 'bearer' | 'apikey' | 'basic' | 'oauth2';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
    clientId?: string;
    clientSecret?: string;
    tokenUrl?: string;
    scope?: string;
}
export interface ApiResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: RequestConfig;
    time?: number;
}
export interface RequestConfig {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    params?: Record<string, any>;
    data?: any;
    timeout?: number | undefined;
}
export declare class ApiClient {
    private config;
    private defaultHeaders;
    constructor(config: ApiClientConfig);
    /**
     * GET request
     */
    get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
    /**
     * POST request
     */
    post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>;
    /**
     * PUT request
     */
    put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>;
    /**
     * PATCH request
     */
    patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>;
    /**
     * DELETE request
     */
    delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
    /**
     * HEAD request
     */
    head<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
    /**
     * OPTIONS request
     */
    options<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
    /**
     * Core request method
     */
    private request;
    /**
     * Build request configuration
     */
    private buildRequestConfig;
    /**
     * Build complete URL with query parameters
     */
    private buildUrl;
    /**
     * Execute HTTP request using fetch API
     */
    private executeRequest;
    /**
     * Parse response body
     */
    private parseResponse;
    /**
     * Parse response headers
     */
    private parseHeaders;
    /**
     * Setup authentication - Enhanced for Week 3 integration
     */
    private setupAuth;
    /**
     * Update authentication - Enhanced for dynamic auth updates
     */
    updateAuth(auth: AuthConfig): void;
    /**
     * Clear authentication
     */
    clearAuth(): void;
    /**
     * Test authentication by making a simple request
     */
    testAuth(testEndpoint?: string): Promise<{
        success: boolean;
        status?: number;
        error?: string;
        headers?: Record<string, string>;
    }>;
    /**
     * Update base URL
     */
    updateBaseURL(baseURL: string): void;
    /**
     * Get current configuration
     */
    getConfig(): ApiClientConfig;
}
/**
 * Custom API Error class
 */
export declare class ApiError extends Error {
    status: number;
    config?: RequestConfig | undefined;
    time?: number | undefined;
    response?: any;
    constructor(message: string, status: number, config?: RequestConfig | undefined, time?: number | undefined, response?: any);
}
/**
 * Create a configured API client instance
 */
export declare function createApiClient(config: ApiClientConfig): ApiClient;
/**
 * Default export
 */
export default ApiClient;
//# sourceMappingURL=api-client.d.ts.map