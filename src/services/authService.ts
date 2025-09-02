import { AuthAPI } from "@/api/api";
import { LoginRequest, LoginResponse, RefreshTokenResponse, RegisterRequest, User, VerifyTokenResponse } from "@/types/auth";
import { ApiResponse } from "@/types/response";
import { chatSocketService } from "./chatSocketService";

class AuthService {
  // Đăng nhập
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const res = await AuthAPI.login(credentials);
      if (res.status && res.data) this.saveTokens(res.data.access_token, res.data.refresh_token);
      return res;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Đăng ký
  async register(data: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const res = await AuthAPI.register(data);
      if (res.status && res.data) this.saveTokens(res.data.access_token, res.data.refresh_token);
      return res;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  }

  // Làm mới token
  async refreshToken(refreshToken?: string): Promise<ApiResponse<RefreshTokenResponse>> {
    try {
      const token = refreshToken || localStorage.getItem("refresh_token");
      if (!token) throw new Error("No refresh token available");
      const res = await AuthAPI.refreshToken({ refresh_token: token });
      if (res.status && res.data) this.saveTokens(res.data.access_token, res.data.refresh_token);
      return res;
    } catch (error) {
      console.error("Refresh token error:", error);
      this.logout();
      throw error;
    }
  }

  // Kiểm tra token
  async verifyToken(token?: string): Promise<ApiResponse<VerifyTokenResponse>> {
    try {
      const t = token || localStorage.getItem("token");
      if (!t) throw new Error("No token to verify");
      return await AuthAPI.verifyToken({ token: t });
    } catch (error) {
      console.error("Verify token error:", error);
      throw error;
    }
  }

  // Lấy profile
  async getProfile(userId?: string): Promise<ApiResponse<User>> {
    try {
      return await AuthAPI.fetchUserProfile(userId);
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  }

  // Đăng nhập với GitHub
  async loginWithGitHub(): Promise<void> {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_GITHUB_CALLBACK_URL;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
  }

  // Xử lý callback GitHub
  async handleGitHubCallback(code: string): Promise<ApiResponse<LoginResponse>> {
    try {
      const res = await AuthAPI.githubLogin({ code });
      if (res.status && res.data) this.saveTokens(res.data.access_token, res.data.refresh_token || "");
      return res;
    } catch (error: any) {
      console.error("GitHub callback error:", error);
      throw error;
    }
  }

  // Đăng xuất
  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    chatSocketService.disconnect();
    window.location.href = "/auth";
  }

  // Kiểm tra đăng nhập
  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
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
  }

  // Kiểm tra token hết hạn
  isTokenExpired(token?: string): boolean {
    try {
      const t = token || this.getAccessToken();
      if (!t) return true;
      const payload = JSON.parse(atob(t.split(".")[1]));
      return payload.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }

  // Lấy user từ token
  getUserFromToken(token?: string): User | null {
    try {
      const t = token || this.getAccessToken();
      if (!t) return null;
      const payload = JSON.parse(atob(t.split(".")[1]));
      return { id: payload.sub, email: payload.email, name: payload.name };
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;
