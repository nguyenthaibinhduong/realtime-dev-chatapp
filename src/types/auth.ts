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
  username: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  github_email?: string;  
  username?: string;
  email_verified?: boolean;
  avatar?: string;
  role: string | null;
  github_verified: boolean;
  github_installation_id: string | null;
  github_avatar?: string;
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
