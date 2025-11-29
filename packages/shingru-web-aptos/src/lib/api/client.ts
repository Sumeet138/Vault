import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export type RequestConfig = {} & Omit<AxiosRequestConfig, "url" | "method">;

class BackendClient {
  private client: AxiosInstance | null;
  private baseURL: string;

  constructor() {
    // Backend-less: No backend URL needed
    this.baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

    // Only create axios instance if baseURL is provided
    if (this.baseURL) {
      this.client = axios.create({
        baseURL: this.baseURL,
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 seconds
        withCredentials: true, // Enable credentials for CORS requests
      });

      // Request interceptor for error handling
      this.client.interceptors.request.use(
        (config) => {
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      // Response interceptor for error handling
      this.client.interceptors.response.use(
        (response: AxiosResponse) => {
          return response;
        },
        (error) => {
          // Only log errors if backend URL is configured
          if (process.env.NODE_ENV === "development") {
            console.error(
              "❌ API Error:",
              error.response?.status,
              error.response?.data || error.message
            );
          }
          return Promise.reject(error);
        }
      );
    } else {
      this.client = null;
    }
  }

  /**
   * Make a generic request with full type safety
   */
  async request<TResponse = any>(
    config: AxiosRequestConfig
  ): Promise<ApiResponse<TResponse>> {
    // Backend-less: If no backend URL, return error silently (no console logs)
    if (!this.baseURL || !this.client) {
      return { error: "Backend not configured (backend-less mode)" };
    }

    try {
      const response = await this.client.request<TResponse>(config);
      return { data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Network error occurred";
        return { error: errorMessage };
      }
      return { error: "Unknown error occurred" };
    }
  }

  /**
   * GET request with type safety
   * @example
   * const result = await client.get<UserProfile>('/user/profile');
   */
  async get<TResponse = any>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>({ ...config, method: "GET", url });
  }

  /**
   * POST request with type safety
   * @example
   * const result = await client.post<LoginResponse, LoginRequest>('/auth/login', { email, password });
   */
  async post<TResponse = any, TData = any>(
    url: string,
    data?: TData,
    config?: RequestConfig
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>({ ...config, method: "POST", url, data });
  }

  /**
   * PUT request with type safety
   * @example
   * const result = await client.put<User, UpdateUserRequest>('/user/123', updateData);
   */
  async put<TResponse = any, TData = any>(
    url: string,
    data?: TData,
    config?: RequestConfig
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>({ ...config, method: "PUT", url, data });
  }

  /**
   * PATCH request with type safety
   * @example
   * const result = await client.patch<User, PartialUser>('/user/123', partialData);
   */
  async patch<TResponse = any, TData = any>(
    url: string,
    data?: TData,
    config?: RequestConfig
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>({ ...config, method: "PATCH", url, data });
  }

  /**
   * DELETE request with type safety
   * @example
   * const result = await client.delete<{ success: boolean }>('/user/123');
   */
  async delete<TResponse = any>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>({ ...config, method: "DELETE", url });
  }

  /**
   * Set authentication token for all subsequent requests
   * @param token JWT token
   */
  setAuthToken(token: string): void {
    if (!this.client) return;

    // Validate token before setting
    if (!token || typeof token !== 'string' || token.trim() === '' || token === 'null' || token === 'undefined') {
      console.warn('Invalid token provided to setAuthToken, removing auth header instead');
      this.removeAuthToken();
      return;
    }

    // Clean the token (remove any extra slashes or invalid characters)
    const cleanToken = token.replace(/[\/]+/g, '').trim();

    if (cleanToken === '' || cleanToken.length < 10) {
      console.warn('Token appears to be malformed, removing auth header instead');
      this.removeAuthToken();
      return;
    }

    this.client.defaults.headers.common["Authorization"] = `Bearer ${cleanToken}`;
  }

  /**
   * Remove authentication token
   */
  removeAuthToken(): void {
    if (!this.client) return;
    delete this.client.defaults.headers.common["Authorization"];
  }

  /**
   * Get the raw axios instance for advanced usage
   */
  get axios(): AxiosInstance | null {
    return this.client;
  }
}

export const backendClient = new BackendClient();
