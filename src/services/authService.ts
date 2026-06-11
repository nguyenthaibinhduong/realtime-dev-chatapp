import { AuthAPI } from "@/api/api";
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  RegisterRequest,
  User,
  VerifyTokenResponse,
} from "@/types/auth";
import { ApiResponse } from "@/types/response";
import { chatSocketService } from "./chatSocketService";

class AuthService {
  private isRefreshing = false;
  private refreshAttempts = 0;
  private maxRefreshAttempts = 3;

  // Đăng nhập
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const res = await AuthAPI.login(credentials);
      if (res.status && res.data) {
        this.saveTokens(res.data.access_token, res.data.refresh_token);
        this.resetRefreshAttempts();
        chatSocketService.connect(res.data.access_token, true);
        return res;
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Đăng ký
  async register(data: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const res = await AuthAPI.register(data);
      // if (res.status && res.data)
      //   this.saveTokens(res.data.access_token, res.data.refresh_token);
      return res;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  }

  // Reset refresh attempts counter
  private resetRefreshAttempts(): void {
    this.refreshAttempts = 0;
    localStorage.removeItem("refresh_failed");
  }

  // Làm mới token with improved retry mechanism
  async refreshToken(
    refreshToken?: string
  ): Promise<ApiResponse<RefreshTokenResponse>> {
    try {
      // If already refreshing, wait until finished
      if (this.isRefreshing) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          status: true,
          msg: "Waiting for token refresh",
          data: null as any,
        };
      }

      this.isRefreshing = true;

      const token = refreshToken || localStorage.getItem("refresh_token");
      if (!token) throw new Error("No refresh token available");

      // Check if refresh token is expired
      if (this.isTokenExpired(null, token)) {
        console.error("Refresh token expired");
        this.logout();
        throw new Error("Refresh token expired");
      }

      const res = await AuthAPI.refreshToken({ refresh_token: token });
      if (res.status && res.data) {
        this.saveTokens(res.data.access_token, res.data.refresh_token);
        this.resetRefreshAttempts();
        localStorage.removeItem("refresh_failed");
      }

      return res;
    } catch (error) {
      console.error("Refresh token error:", error);
      this.refreshAttempts++;

      if (this.refreshAttempts >= this.maxRefreshAttempts) {
        localStorage.setItem("refresh_failed", "true");
        this.logout();
      }

      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Kiểm tra token
  async verifyToken(token?: string): Promise<ApiResponse<VerifyTokenResponse>> {
    try {
      const t = token || localStorage.getItem("token");
      if (!t) throw new Error("No token to verify");
      return await AuthAPI.verifyToken();
    } catch (error) {
      console.error("Verify token error:", error);
      throw error;
    }
  }

  // Lấy profile
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const res = await AuthAPI.getProfile();
      if (res.status === 200 && res.data) {
        localStorage.setItem("app_user", JSON.stringify(res.data));
        return res.data;
      }
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  }

  // Đăng nhập với GitHub
  async loginWithGitHub(): Promise<{ url: string }> {
    return await AuthAPI.goToLoginGithub();
  }

  async loginWithGoogle(): Promise<{ url: string }> {
    return await AuthAPI.goToLoginGoogle();
  }

  async loginUpdateWithGitHub(): Promise<{ url: string }> {
    return await AuthAPI.goToUpdateLoginGithub();
  }

  async loginUpdateWithGoogle(): Promise<{ url: string }> {
    return await AuthAPI.goToUpdateLoginGoogle();
  }

  async installGitHubApp(): Promise<void> {
    return await AuthAPI.goToInstallGithub();
  }

  async handleOAuthCallback(
    access_token: string,
    refresh_token: string
  ): Promise<void> {
    try {
      if (access_token && refresh_token) {
        this.saveTokens(access_token, refresh_token);
        this.resetRefreshAttempts();
        chatSocketService.connect(access_token, true);
      }
    } catch (error) {
      console.error("GitHub callback error:", error);
      throw error;
    }
  }

  // Xử lý callback GitHub
  async handleGitHubCallback(
    access_token: string,
    refresh_token: string
  ): Promise<void> {
    return this.handleOAuthCallback(access_token, refresh_token);
  }

  async handleGoogleCallback(
    access_token: string,
    refresh_token: string
  ): Promise<void> {
    return this.handleOAuthCallback(access_token, refresh_token);
  }

  // Đăng xuất
  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("needs_github_link");
    chatSocketService.disconnect();
    window.location.href = "/auth";
  }

  // Improved authentication check
  isAuthenticated(): boolean {
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refresh_token");
    const refreshFailed = localStorage.getItem("refresh_failed") === "true";

    if (refreshFailed) return false;
    if (!token && !refreshToken) return false;

    // If access token is valid, user is authenticated
    if (token && !this.isTokenExpired()) return true;

    // If access token is expired but refresh token is valid, user is still authenticated
    return !!refreshToken && !this.isTokenExpired(null, refreshToken);
  }

  // Get token expiration time in milliseconds
  getTokenExpirationTime(token?: string): number | null {
    try {
      const t = token || this.getAccessToken();
      if (!t) return null;
      const payload = JSON.parse(atob(t.split(".")[1]));
      return payload.exp * 1000; // Convert seconds to milliseconds
    } catch {
      return null;
    }
  }

  // Lấy access token
  getAccessToken(): string | null {
    return localStorage.getItem("token");
  }

  // Lấy refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem("refresh_token");
  }

  // Lưu token
  private saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    chatSocketService.connect(accessToken, true);
  }

  // Kiểm tra token hết hạn - modified to handle refresh tokens
  isTokenExpired(token?: string, refreshToken?: string): boolean {
    try {
      const t = token || refreshToken || this.getAccessToken();
      if (!t) return true;
      const payload = JSON.parse(atob(t.split(".")[1]));
      return payload.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }
}

export const authService = new AuthService();
export default authService;
