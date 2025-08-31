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

// Interceptor request: luôn đính kèm token từ localStorage nếu có
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

// Interceptor response: nếu lỗi 409 (token hết hạn), tự động refresh và retry
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Nếu lỗi là 409 (token hết hạn) và chưa retry
    if (error.response?.status === 409 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh -> push vào queue chờ
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers)
              originalRequest.headers.Authorization = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const refreshRes = await axios.post(
          `${API_URL}/auth/refresh-token`,
          { refresh_token: refreshToken }
        );

        const newToken = refreshRes.data.access_token;
        localStorage.setItem("token", newToken);

        api.defaults.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);

        if (originalRequest.headers)
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/auth";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
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

// Hàm GET (không cần truyền token, interceptor sẽ tự động gắn nếu có)
export async function get<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const res: AxiosResponse<T> = await api.get(url, config);
  return res.data;
}

// Hàm POST (không cần truyền token, interceptor sẽ tự động gắn nếu có)
export async function post<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const res: AxiosResponse<T> = await api.post(url, data, config);
  return res.data;
}

// Hàm GET cần auth (không cần truyền token, interceptor sẽ tự động gắn nếu có)
export async function apiget<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const res: AxiosResponse<T> = await api.get(url, config);
  return res.data;
}

// Hàm POST cần truyền token thủ công (nếu muốn override)
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
  const res: AxiosResponse<T> = await api.post(url, data, authConfig);
  return res.data;
}

// Có thể thêm các hàm PUT, DELETE tương tự nếu cần
export default api;