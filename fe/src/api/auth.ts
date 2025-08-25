import { get, post } from "./Http";

// Lấy thông tin user (GET)
export async function fetchUserProfile(userId: string) {
  return get(`/users/${userId}`);
}

// Đăng nhập (POST)
export async function login(data: any) {
  return post("/auth/login", data);
}

// Đăng ký (POST)
export async function register(data: any) {
  return post("/auth/register", data);
}