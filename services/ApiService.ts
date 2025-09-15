import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { 
  AuthResponse, 
  LoginCredentials, 
  SignupCredentials, 
  User, 
  ApiResponse,
  AppUsage,
  DailyUsage,
  AppBlockingRule,
  DashboardStats
} from '../types';

class ApiService {
  private static instance: AxiosInstance;
  private static readonly BASE_URL = 'https://api.mindease.app'; // Replace with your actual API URL
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  /**
   * Initialize the API service
   */
  static initialize(): void {
    this.instance = axios.create({
      baseURL: this.BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      async (config) => {
        const token = await this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await this.getStoredRefreshToken();
            if (refreshToken) {
              const newToken = await this.refreshAuthToken(refreshToken);
              if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return this.instance(originalRequest);
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            await this.logout();
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Authentication Methods
   */
  static async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.instance.post(
        '/auth/login',
        credentials
      );

      if (response.data.success && response.data.data) {
        await this.storeTokens(response.data.data.token, response.data.data.refreshToken);
      }

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async signup(credentials: SignupCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.instance.post(
        '/auth/signup',
        credentials
      );

      if (response.data.success && response.data.data) {
        await this.storeTokens(response.data.data.token, response.data.data.refreshToken);
      }

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async logout(): Promise<void> {
    try {
      await this.instance.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearStoredTokens();
    }
  }

  static async refreshAuthToken(refreshToken: string): Promise<string | null> {
    try {
      const response: AxiosResponse<ApiResponse<{ token: string }>> = await this.instance.post(
        '/auth/refresh',
        { refreshToken }
      );

      if (response.data.success && response.data.data) {
        await this.storeTokens(response.data.data.token, refreshToken);
        return response.data.data.token;
      }

      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  static async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await this.instance.get('/auth/me');
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * App Usage Methods
   */
  static async syncAppUsage(usageData: DailyUsage[]): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await this.instance.post(
        '/usage/sync',
        { usageData }
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async getAppUsageHistory(days: number = 7): Promise<ApiResponse<DailyUsage[]>> {
    try {
      const response: AxiosResponse<ApiResponse<DailyUsage[]>> = await this.instance.get(
        `/usage/history?days=${days}`
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response: AxiosResponse<ApiResponse<DashboardStats>> = await this.instance.get(
        '/usage/dashboard'
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * App Blocking Methods
   */
  static async getBlockingRules(): Promise<ApiResponse<AppBlockingRule[]>> {
    try {
      const response: AxiosResponse<ApiResponse<AppBlockingRule[]>> = await this.instance.get(
        '/blocking/rules'
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async createBlockingRule(rule: Omit<AppBlockingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<AppBlockingRule>> {
    try {
      const response: AxiosResponse<ApiResponse<AppBlockingRule>> = await this.instance.post(
        '/blocking/rules',
        rule
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async updateBlockingRule(id: string, rule: Partial<AppBlockingRule>): Promise<ApiResponse<AppBlockingRule>> {
    try {
      const response: AxiosResponse<ApiResponse<AppBlockingRule>> = await this.instance.put(
        `/blocking/rules/${id}`,
        rule
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async deleteBlockingRule(id: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await this.instance.delete(
        `/blocking/rules/${id}`
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Settings Methods
   */
  static async updateUserSettings(settings: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await this.instance.put(
        '/user/settings',
        settings
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await this.instance.put(
        '/user/password',
        { currentPassword, newPassword }
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async deleteAccount(): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await this.instance.delete(
        '/user/account'
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Token Management
   */
  private static async storeTokens(token: string, refreshToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.TOKEN_KEY, token);
      await SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  private static async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  private static async getStoredRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting stored refresh token:', error);
      return null;
    }
  }

  private static async clearStoredTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.TOKEN_KEY);
      await SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing stored tokens:', error);
    }
  }

  /**
   * Error Handling
   */
  private static handleError(error: any): ApiResponse<any> {
    console.error('API Error:', error);

    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        error: error.response.data?.message || error.response.data?.error || 'Server error occurred',
        data: null,
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        error: 'Network error. Please check your internet connection.',
        data: null,
      };
    } else {
      // Something else happened
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
        data: null,
      };
    }
  }

  /**
   * Utility Methods
   */
  static isAuthenticated(): Promise<boolean> {
    return this.getStoredToken().then(token => !!token);
  }

  static async getAuthHeaders(): Promise<{ [key: string]: string }> {
    const token = await this.getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// Initialize the service
ApiService.initialize();

export default ApiService;

