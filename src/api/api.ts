import { Notification } from "@/types/notifications";
import { get, post, apiget, apipost } from "./Http";
import { unlink } from "fs";

export const AuthAPI = {
  // Không cần auth
  login: async (data: any) => post("/auth/login", data),
  listOnline: async () => apiget("/users/list-online"),
  register: async (data: any) => post("/auth/register", data),
  forgotPassword: async (data: any) => post("/auth/forgot-password", { data }),
  verifyToken: async () => post("/auth/verify-token"),
  fetchUserProfile: async (id: string) => post(`/users/${id}`),
  getProfile: async () => apipost("auth/get-profile"),
  changePassword: async (data: any) => apipost("/auth/change-password", data),
  updateProfile: async (data: any) => apipost("/auth/update-profile", data),
  logout: async () => apipost("/auth/logout"),
  refreshToken: async (data: any) => apipost("/auth/refresh-token", data),
  githubLogin: async (code: string) =>
    post(`/github-app/callback?${code}`, { code }),
  confirmEmail: async (token: string) =>
    get(`/auth/confirm-email?token=${encodeURIComponent(token)}`),
  goToLoginGithub: async () => get("/auth/github-oauth/redirect"),
  goToInstallGithub: async () => apipost("/github-app/redirect"),
  goToUpdateLoginGithub: async () => apipost("/auth/github-oauth/redirect-update"),
};

export const ChatAPI = {
  fetchChannel: async () => apiget(`channels/list-channels`),
  fetchUnread: async () => apiget(`channels/unread-map`),
  fetchMessage: async (channelId: string, pageSize?: number, before?: string) =>
    apiget(
      `channels/list-messages/${channelId}?pageSize=${pageSize ?? 50}&before=${
        before ?? ""
      }`
    ),
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

export const UploadApi = {
  getPresignedUrl: async (data: any) =>
    apipost("upload/get-presigned-url", data),

  getObjectUrl: async (data: any) => apipost("upload/get-object-url", data),
};

export const GithubAPI = {
  getInstallationRepos: async () => apipost(`/git/get_repo_installation`),
  getRepoData: async (data: any) => apipost(`/git/get_repo_data_by_url`, data),
  getRepoForChannel: async (data: any) =>apipost(`/git/get_list_repo_data_by_channel`, data),
  addReposToChannel: async (data: any) => apipost(`/channels/add-repositories`, data),
  removeReposToChannel: async (data: any) => apipost(`/channels/remove-repositories`, data),
  unlinkGithub: async () => apipost(`/github-app/uninstall`),
};

export const NotificationAPI = {
  fetchNotifications: async (data:any) => apiget(`/notifications?page=${data.page}&limit=${data.limit}`),
  markAsRead: async (id: string) => apipost(`/notifications/${id}/read`),
  deleteNotification: async (id: string) => apipost(`/notifications/${id}/delete`),
};
