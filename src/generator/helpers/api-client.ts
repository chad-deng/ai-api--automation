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

export class ApiClient {
  private config: ApiClientConfig;
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  constructor(config: ApiClientConfig) {
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
  async get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  /**
   * HEAD request
   */
  async head<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'HEAD', url });
  }

  /**
   * OPTIONS request
   */
  async options<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'OPTIONS', url });
  }

  /**
   * Core request method
   */
  private async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
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
    } catch (error) {
      const endTime = performance.now();
      
      if (error instanceof ApiError) {
        error.time = endTime - startTime;
        throw error;
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Request failed',
        0,
        config,
        endTime - startTime
      );
    }
  }

  /**
   * Build request configuration
   */
  private buildRequestConfig(config: RequestConfig): RequestConfig {
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
  private buildUrl(path: string, params?: Record<string, any>): string {
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
  private async executeRequest(config: RequestConfig): Promise<ApiResponse> {
    const { url, method = 'GET', headers, data, timeout } = config;

    const fetchOptions: RequestInit = {
      method,
      headers: headers as any,
    };

    // Add request body for non-GET requests
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      if (typeof data === 'object') {
        fetchOptions.body = JSON.stringify(data);
      } else {
        fetchOptions.body = data;
      }
    }

    // Add timeout support
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    fetchOptions.signal = controller.signal;

    try {
      const response = await fetch(url!, fetchOptions);
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

    } catch (error) {
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
  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } else if (contentType.includes('text/')) {
      return response.text();
    } else {
      return response.blob();
    }
  }

  /**
   * Parse response headers
   */
  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Setup authentication - Enhanced for Week 3 integration
   */
  private setupAuth(auth: AuthConfig): void {
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
  public updateAuth(auth: AuthConfig): void {
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
  public clearAuth(): void {
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
  public async testAuth(testEndpoint: string = '/health'): Promise<{
    success: boolean;
    status?: number;
    error?: string;
    headers?: Record<string, string>;
  }> {
    try {
      const response = await this.get(testEndpoint);
      return {
        success: true,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
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
  public updateBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
  }

  /**
   * Get current configuration
   */
  public getConfig(): ApiClientConfig {
    return { ...this.config };
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public status: number;
  public config?: RequestConfig | undefined;
  public time?: number | undefined;
  public response?: any;

  constructor(
    message: string, 
    status: number, 
    config?: RequestConfig | undefined, 
    time?: number | undefined, 
    response?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.config = config;
    this.time = time;
    this.response = response;
  }
}

/**
 * Create a configured API client instance
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}

/**
 * Default export
 */
export default ApiClient;