import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3088/v1/api";

// Tạo instance chung cho axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor request -> luôn đính kèm token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor response -> handle lỗi và refresh token
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<any>) => {
    if (error.response?.status === 409) {
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const refreshRes = await axios.post(
            `${API_URL}/auth/refresh-token`,
            { refresh_token: refreshToken }
          );
          if (refreshRes.status === 201 && refreshRes.data.access_token) {
            localStorage.setItem("token", refreshRes.data.access_token);
            // gắn lại token vào header request cũ
            if (error.config?.headers) {
              error.config.headers.Authorization = `Bearer ${refreshRes.data.access_token}`;
            }
            // gọi lại request bị fail
            return api.request(error.config!);
          }
        }
      } catch (refreshError) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/auth"; // đẩy về login
      }
    }
    return Promise.reject(error);
  }
);

// Xử lý lỗi chung
function handleError(error: AxiosError) {
  if (error.response) {
    // Server trả về lỗi
    console.error("API Error:", error.response.status, error.response.data);
    return Promise.reject(error.response.data);
  } else if (error.request) {
    // Không nhận được phản hồi từ server
    console.error("No response from server:", error.request);
    return Promise.reject({ message: "No response from server" });
  } else {
    // Lỗi khác
    console.error("Error:", error.message);
    return Promise.reject({ message: error.message });
  }
}

// Hàm GET không cần auth
export async function get<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const res: AxiosResponse<T> = await api.get(url, config);
    return res.data;
  } catch (error) {
    return handleError(error as AxiosError);
  }
}

// Hàm POST không cần auth
export async function post<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const res: AxiosResponse<T> = await api.post(url, data, config);
    return res.data;
  } catch (error) {
    return handleError(error as AxiosError);
  }
}

// Hàm GET cần auth (thêm tham số token)
export async function apiget<T = any>(
  url: string,
  token: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const authConfig = {
    ...config,
    headers: {
      ...(config?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    const res: AxiosResponse<T> = await api.get(url, authConfig);
    return res.data;
  } catch (error) {
    return handleError(error as AxiosError);
  }
}

// Hàm POST cần auth (thêm tham số token)
export async function apipost<T = any>(
  url: string,
  token?: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const authConfig = {
    ...config,
    headers: {
      ...(config?.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
  try {
    const res: AxiosResponse<T> = await api.post(url, data, authConfig);
    return res.data;
  } catch (error) {
    return handleError(error as AxiosError);
  }
}

// Có thể thêm các hàm PUT, DELETE tương tự nếu cần
export default api;