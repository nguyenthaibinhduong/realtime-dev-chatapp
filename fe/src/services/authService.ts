import axiosInstance from "../api/axiosInstance";
import { AUTH_API } from "../api/api.config";
import { ApiResponse } from "../api/api.interface";

// ===== Auth Types =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user?: User;
}

export interface ProfileRequest {
  userId: number;
}

// ===== Auth Service Class =====
class AuthService {
  /**
   * Login user với email và password
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
        AUTH_API.LOGIN,
        credentials
      );

      // Auto save tokens to localStorage after successful login
      if (response.data.status && response.data.data) {
        const { access_token, refresh_token } = response.data.data;
        this.saveTokens(access_token, refresh_token);
      }

      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(
    userData: RegisterRequest
  ): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
        AUTH_API.REGISTER,
        userData
      );

      // Auto save tokens to localStorage after successful registration
      if (response.data.status && response.data.data) {
        const { access_token, refresh_token } = response.data.data;
        this.saveTokens(access_token, refresh_token);
      }

      return response.data;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshToken?: string
  ): Promise<ApiResponse<RefreshTokenResponse>> {
    try {
      const token = refreshToken || localStorage.getItem("refresh_token");

      if (!token) {
        throw new Error("No refresh token available");
      }

      const response = await axiosInstance.post<
        ApiResponse<RefreshTokenResponse>
      >(
        AUTH_API.REFRESH,
        { "refresh-token": token } // Theo format trong Postman
      );

      // Update tokens in localStorage
      if (response.data.status && response.data.data) {
        const { access_token, refresh_token: newRefreshToken } =
          response.data.data;
        this.saveTokens(access_token, newRefreshToken);
      }

      return response.data;
    } catch (error) {
      console.error("Refresh token error:", error);
      this.logout(); // Clear tokens nếu refresh fail
      throw error;
    }
  }

  /**
   * Verify token validity
   */
  async verifyToken(token?: string): Promise<ApiResponse<VerifyTokenResponse>> {
    try {
      const tokenToVerify = token || localStorage.getItem("token");

      if (!tokenToVerify) {
        throw new Error("No token to verify");
      }

      const response = await axiosInstance.post<
        ApiResponse<VerifyTokenResponse>
      >(AUTH_API.VERIFY, { token: tokenToVerify });

      return response.data;
    } catch (error) {
      console.error("Verify token error:", error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId?: number): Promise<ApiResponse<User>> {
    try {
      let requestData = {};

      if (userId) {
        requestData = { userId };
      }

      const response = await axiosInstance.post<ApiResponse<User>>(
        AUTH_API.PROFILE,
        requestData
      );

      return response.data;
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  }

  /**
   * GitHub OAuth login
   */
  async loginWithGitHub(): Promise<void> {
    // Redirect to GitHub OAuth
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_GITHUB_CALLBACK_URL;
    const scope = "user:email";

    const githubOAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

    window.location.href = githubOAuthUrl;
  }

  async handleGitHubCallback(
    code: string
  ): Promise<ApiResponse<LoginResponse>> {
    try {
      console.log("Sending GitHub code to backend:", code);
      console.log("API endpoint:", AUTH_API.GITHUB.LOGIN);

      // Sử dụng GET request với query parameter thay vì POST
      const response = await axiosInstance.get<ApiResponse<LoginResponse>>(
        `${AUTH_API.GITHUB.LOGIN}?code=${encodeURIComponent(code)}`
      );

      console.log("Backend response:", response.data);

      if (response.data.status && response.data.data) {
        const { access_token, refresh_token, user } = response.data.data;
        this.saveTokens(access_token, refresh_token || "");
        return response.data;
      }

      throw new Error(response.data.msg || "GitHub login failed");
    } catch (error: any) {
      console.error("GitHub callback error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });
      throw error;
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    try {
      // Clear tokens from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");

      // Redirect to auth page
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem("token");
    return !!token;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem("token");
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem("refresh_token");
  }

  /**
   * Save tokens to localStorage
   */
  private saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token?: string): boolean {
    try {
      const tokenToCheck = token || this.getAccessToken();

      if (!tokenToCheck) return true;

      const payload = JSON.parse(atob(tokenToCheck.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      return payload.exp < currentTime;
    } catch (error) {
      console.error("Error checking token expiry:", error);
      return true;
    }
  }

  /**
   * Get user info from token
   */
  getUserFromToken(token?: string): User | null {
    try {
      const tokenToCheck = token || this.getAccessToken();

      if (!tokenToCheck) return null;

      const payload = JSON.parse(atob(tokenToCheck.split(".")[1]));

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
      };
    } catch (error) {
      console.error("Error getting user from token:", error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
