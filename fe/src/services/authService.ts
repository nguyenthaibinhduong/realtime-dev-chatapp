import axiosInstance from "../api/axiosInstance";
import { ApiResponse } from "../api/api.interface";
import { AUTH_API } from "../api/api.config";

// Auth related types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string | null;
  avatar: string | null;
  provider: string | null;
  providerId: string | null;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  password: string;
  confirmPassword: string;
}

export interface TokenVerificationResponse {
  valid: boolean;
  decoded?: any;
}

// Auth Service Class
class AuthService {
  private tokenRefreshPromise: Promise<ApiResponse<AuthResponse>> | null = null;

  // Login user
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      AUTH_API.LOGIN,
      credentials
    );

    if (response.data.status && response.data.data.token) {
      this.setToken(response.data.data.token);
      if (response.data.data.refreshToken) {
        this.setRefreshToken(response.data.data.refreshToken);
      }
    }

    return response.data;
  }

  // Register user
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      AUTH_API.REGISTER,
      userData
    );

    // Store token in localStorage on successful registration
    if (response.data.status && response.data.data.token) {
      this.setToken(response.data.data.token);
      if (response.data.data.refreshToken) {
        this.setRefreshToken(response.data.data.refreshToken);
      }
    }

    return response.data;
  }

  // Logout user
  async logout(): Promise<ApiResponse<null>> {
    try {
      const response = await axiosInstance.post<ApiResponse<null>>(
        AUTH_API.LOGOUT
      );
      return response.data;
    } catch (error) {
      // Log error but don't throw - we still want to clear local tokens
      console.error("Logout API call failed:", error);
      return {
        status: true,
        message: "Logged out locally",
        data: null,
      };
    } finally {
      // Always clear local storage, even if API call fails
      this.clearTokens();
    }
  }

  // Get current user profile using the correct endpoint
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await axiosInstance.get<ApiResponse<User>>(
      AUTH_API.PROFILE
    );
    return response.data;
  }

  // Refresh token with prevention of multiple simultaneous requests
  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    // If a refresh is already in progress, wait for it
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      this.tokenRefreshPromise = axiosInstance.post<ApiResponse<AuthResponse>>(
        AUTH_API.REFRESH,
        { refreshToken }
      ).then(response => response.data);

      const result = await this.tokenRefreshPromise;

      // Update tokens
      if (result.status && result.data.token) {
        this.setToken(result.data.token);
        if (result.data.refreshToken) {
          this.setRefreshToken(result.data.refreshToken);
        }
      }

      return result;
    } catch (error) {
      // Clear tokens if refresh fails
      this.clearTokens();
      throw error;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  // Verify token with server
  async verifyToken(): Promise<ApiResponse<TokenVerificationResponse>> {
    const token = this.getToken();
    if (!token) {
      throw new Error("No token available");
    }

    const response = await axiosInstance.post<ApiResponse<TokenVerificationResponse>>(
      AUTH_API.VERIFY,
      { token }
    );

    return response.data;
  }

  // Token management methods
  setToken(token: string): void {
    localStorage.setItem("token", token);
  }

  getToken(): string | null {
    return localStorage.getItem("token");
  }

  setRefreshToken(refreshToken: string): void {
    localStorage.setItem("refreshToken", refreshToken);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  }

  clearTokens(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    // Clear any pending refresh promise
    this.tokenRefreshPromise = null;
  }

  // Enhanced authentication check
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      if (!payload) return false;

      const currentTime = Date.now() / 1000;
      const bufferTime = 60; // 1 minute buffer before expiry

      return payload.exp > (currentTime + bufferTime);
    } catch {
      return false;
    }
  }

  // Check if token is about to expire (within 5 minutes)
  isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      if (!payload) return false;

      const currentTime = Date.now() / 1000;
      const fiveMinutes = 5 * 60; // 5 minutes

      return payload.exp < (currentTime + fiveMinutes);
    } catch {
      return true;
    }
  }

  // Decode JWT token safely
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  // Get user from token (without API call)
  getUserFromToken(): Partial<User> | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = this.decodeToken(token);
      if (!payload) return null;

      return {
        id: payload.sub || payload.id || payload.userId,
        email: payload.email,
        username: payload.username,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }

  // Get token expiry time
  getTokenExpiry(): Date | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return null;

      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }

  // Auto refresh token if it's expiring soon
  async ensureValidToken(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    if (this.isTokenExpiringSoon()) {
      try {
        await this.refreshToken();
        return true;
      } catch (error) {
        console.error("Auto token refresh failed:", error);
        this.clearTokens();
        return false;
      }
    }

    return true;
  }

  // Initialize auth state (call this on app startup)
  async initializeAuth(): Promise<{ isAuthenticated: boolean; user: User | null }> {
    try {
      // Check if we have a valid token
      if (!this.isAuthenticated()) {
        this.clearTokens();
        return { isAuthenticated: false, user: null };
      }

      // Try to refresh if token is expiring soon
      if (this.isTokenExpiringSoon()) {
        await this.refreshToken();
      }

      // Get current user
      const userResponse = await this.getCurrentUser();
      if (userResponse.status) {
        return { isAuthenticated: true, user: userResponse.data };
      } else {
        this.clearTokens();
        return { isAuthenticated: false, user: null };
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      this.clearTokens();
      return { isAuthenticated: false, user: null };
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;

// Export individual methods for easier testing and usage
export const {
  login,
  register,
  logout,
  getCurrentUser,
  refreshToken,
  verifyToken,
  setToken,
  getToken,
  setRefreshToken,
  getRefreshToken,
  clearTokens,
  isAuthenticated,
  isTokenExpiringSoon,
  getUserFromToken,
  getTokenExpiry,
  ensureValidToken,
  initializeAuth,
} = authService;
