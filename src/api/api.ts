import  {  post, apiget, apipost } from "./Http";

export const AuthAPI = {
  // Không cần auth
  login: async(data: any) => post("/auth/login", data),
  register: async(data: any) => post("/auth/register", data),
  forgotPassword: async(data: any) => post("/auth/forgot-password", { data }),
  verifyToken: async(data: any) => post("/auth/verify-token", { data }),
  fetchUserProfile: async(id: string) => apiget(`/users/${id}`),
  changePassword: async(data: any) => apipost("/auth/change-password", data),
  updateProfile: async(data: any) => apipost("/users/update-profile", data),
  logout: async() => apipost("/auth/logout"),
  refreshToken: async (data: any) => apipost("/auth/refresh-token", data),
  githubLogin: async(data:any) => apipost("/auth/github-oauth", data),
};


export const ChatAPI = {
  fetchChannel: async() => apiget(`channels/list-channels`),
};

 