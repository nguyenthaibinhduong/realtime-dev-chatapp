import { Notification } from "@/types/notifications";
import { get, post, apiget, apipost } from "./Http";
import { rename, unlink } from "fs";

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
  goToUpdateLoginGithub: async () =>
    apipost("/auth/github-oauth/redirect-update"),
  updatePassword: async (data: any) => apipost("/auth/update-password", data),
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
  searchMessagesByKeyword: async (data: any) =>
    apipost(`channels/search-keyword-messages`, data),
  sendMessage: async (data: any) => apipost(`channels/send-message`, data),
  createChannel: async (data: any) => apipost(`channels/create-channel`, data),
  updateChannel: async (data: any) => apipost(`channels/update-channel`, data),
  joinChannel: async (data: any) => apipost(`channels/join-channel`, data),
  getChannelByRepository: async (data: any) =>
    apipost(`channels/repository-channels`, data),
  //Tìm kiếm
  fetchSearchUser: async (key: string, limit: number) =>
    apiget(`users/search-user`, {
      params: { key, limit },
    }),
  fetchSearchChat: async (key: string, limit: number, type?: string) =>
    apiget(`channels/search-chat`, {
      params: { type, key, limit },
    }),
  //Channel
  fetchNonMemberUsers: async (params: {
    channelId: string | number;
    username?: string;
    limit?: number;
    cursor?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.username) queryParams.append("username", params.username);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.cursor) queryParams.append("cursor", params.cursor.toString());

    return apiget(
      `/channels/${params.channelId}/list-non-members?${queryParams.toString()}`
    );
  },
  addMembers: async (data: any) => apipost(`channels/add-members`, data),
  removeMember: async (data: any) => apipost(`channels/remove-member`, data),
  leaveChannel: async (data: any) => apipost(`channels/leave-channel`, data),
  renameChannel: async (data: any) => apipost(`channels/rename-channel`, data),
};

export const UploadApi = {
  getPresignedUrl: async (data: any) =>
    apipost("upload/get-presigned-url", data),

  getObjectUrl: async (data: any) => apipost("upload/get-object-url", data),

  getAvatarPresignedUrl: async (data: any) =>
    apipost("upload/get-avatar-presigned-url", data),
  getSheetUrl: async (channelId: any) =>
    apipost("upload/get-sheet-url", { channelId }),
};

export const GithubAPI = {
  getInstallationRepos: async () => apipost(`/git/get_repo_installation`),
  getRepoData: async (data: any) => apipost(`/git/get_repo_data_by_url`, data),
  getRepoForChannel: async (data: any) =>
    apipost(`/git/get_list_repo_data_by_channel`, data),
  addReposToChannel: async (data: any) =>
    apipost(`/channels/add-repositories`, data),
  removeReposToChannel: async (data: any) =>
    apipost(`/channels/remove-repositories`, data),
  unlinkGithub: async () => apipost(`/github-app/uninstall`),
  getCommitAnalysis: async (params: {
    owner: string;
    repo: string;
    sha: string;
    prompt?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.prompt) {
      queryParams.append("prompt", params.prompt);
    }

    return apiget(
      `/github/commit-analysis/${params.owner}/${params.repo}/${params.sha}${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`
    );
  },
};

export const NotificationAPI = {
  fetchNotifications: async (data: any) =>
    apiget(
      `/notifications?page=${data.page}&limit=${data.limit}&type=${data.type || ""}`
    ),
  getCountUnreadNotifications: async () =>
    apipost(`notifications/count-unread`),
  markAsRead: async (id: string) =>
    apipost(`/notifications/mark-as-read`, { id }),
  deleteNotification: async (id: string) =>
    apipost(`/notifications/${id}/delete`),
  markAsAllRead: async () => apipost(`/notifications/mark-all-as-read`),
};

export const AttachmentAPI = {
  getAttachmentsByChannel: async (params: {
    channelId: string | number;
    limit?: number;
    cursor?: number;
    filename?: string;
    mimeType?: string;
    senderId?: string | number;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.cursor) queryParams.append("cursor", params.cursor.toString());
    if (params.filename) queryParams.append("filename", params.filename);
    if (params.mimeType) queryParams.append("mimeType", params.mimeType);
    if (params.senderId)
      queryParams.append("senderId", params.senderId.toString());
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    return apiget(
      `/channels/${params.channelId}/attachments?${queryParams.toString()}`
    );
  },
};
