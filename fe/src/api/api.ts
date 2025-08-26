import { get, post, apiget, apipost } from "./Http";

const AuthAPI = {
  // Không cần auth
   login: async(data: any) => post("/auth/login", data),
  register: async(data: any) => post("/auth/register", data),
  forgotPassword: async(email: string) => post("/auth/forgot-password", { email }),
  verifyToken: async(token: string) => post("/auth/verify-token", { token }),

  // Cần auth
  fetchUserProfile: async({ token,userId }) => apiget(`/users/${userId}`, token),
  fetchUsers: async({ token, params }) => apiget("/users", token, { params }),
  changePassword: async({ token, data }) => apipost("/auth/change-password", token, data),
  updateProfile: async({ token, data }) => apipost("/users/update-profile", token, data),
  logout: async({ token }) => apipost("/auth/logout", token),
  refreshToken: async({ token }) => apipost("/auth/refresh-token", token),
};


const ChatAPI = {
  fetchChannel: async({token,channelId }) => apiget(`chat/channels/${channelId}`, token),

  
};

export default AuthAPI;