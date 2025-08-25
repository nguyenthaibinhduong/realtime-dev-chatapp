import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

// Tạo instance chung cho axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3088/v1/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

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

// Hàm GET
export async function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res: AxiosResponse<T> = await api.get(url, config);
    return res.data;
  } catch (error) {
    return handleError(error as AxiosError);
  }
}

// Hàm POST
export async function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res: AxiosResponse<T> = await api.post(url, data, config);
    return res.data;
  } catch (error) {
    return handleError(error as AxiosError);
  }
}

// Có thể thêm các hàm PUT, DELETE tương tự nếu cần