import { join } from "path";
import { post, apiget, apipost } from "./Http";

export const AuthAPI = {
  // Không cần auth
  login: async (data: any) => post("/auth/login", data),
  listOnline : async () => apiget("/users/list-online"),
  register: async (data: any) => post("/auth/register", data),
  forgotPassword: async (data: any) => post("/auth/forgot-password", { data }),
  verifyToken: async (data: any) => post("/auth/verify-token", { data }),
  fetchUserProfile: async (id: string) => apiget(`/users/${id}`),
  changePassword: async (data: any) => apipost("/auth/change-password", data),
  updateProfile: async (data: any) => apipost("/users/update-profile", data),
  logout: async () => apipost("/auth/logout"),
  refreshToken: async (data: any) => apipost("/auth/refresh-token", data),
  githubLogin: async (code: string) => post("/auth/github-oauth", { code }),
};

export const ChatAPI = {
  fetchChannel: async () => apiget(`channels/list-channels`),
  fetchMessage: async (channelId: string , pageSize?: number, before?: string) => apiget(`channels/list-messages/${channelId}?pageSize=${pageSize ?? 50}&before=${before ?? ''}`),
  createChannel: async (data: any) => apipost(`channels/create-channel`, data),
  joinChannel: async (data: any) => apipost(`channels/join-channel`, data),
  //Tìm kiếm
  fetchSearchUser: async (key: string, limit: number) =>
    apiget(`users/search-user`, {
      params: { key, limit },
    }),
  fetchSearchChat: async (key: string, limit: number, type?: string) =>
    apiget(`channels/search-chat`, {
      params: { type, key, limit },
    }),
};
