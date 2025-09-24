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
  // Đăng nhập
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const res = await AuthAPI.login(credentials);
      if (res.status && res.data) {
        this.saveTokens(res.data.access_token, res.data.refresh_token);
        
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

  // Làm mới token
  async refreshToken(
    refreshToken?: string
  ): Promise<ApiResponse<RefreshTokenResponse>> {
    try {
      const token = refreshToken || localStorage.getItem("refresh_token");
      if (!token) throw new Error("No refresh token available");
      const res = await AuthAPI.refreshToken({ refresh_token: token });
      if (res.status && res.data)
        this.saveTokens(res.data.access_token, res.data.refresh_token);

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
  async loginWithGitHub(): Promise<void> {
    return await AuthAPI.goToLoginGithub();
  }

  async installGitHubApp(): Promise<void> {
    return await AuthAPI.goToInstallGithub();
  }

  // Xử lý callback GitHub
  async handleGitHubCallback(
    access_token: string,
    refresh_token: string
  ): Promise<void> {
    try {
      if (access_token && refresh_token) {
        this.saveTokens(access_token, refresh_token);
        chatSocketService.connect(access_token, true);
      }
    } catch (error) {
      console.error("GitHub callback error:", error);
      throw error;
    }
  }

  // Đăng xuất
  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("needs_github_link");
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
    chatSocketService.connect(accessToken, true);
  }

  // Kiểm tra token hết hạn
  // isTokenExpired(token?: string): boolean {
  //   try {
  //     const t = token || this.getAccessToken();
  //     if (!t) return true;
  //     const payload = JSON.parse(atob(t.split(".")[1]));
  //     return payload.exp < Math.floor(Date.now() / 1000);
  //   } catch {
  //     return true;
  //   }
  // }


}

export const authService = new AuthService();
export default authService;
