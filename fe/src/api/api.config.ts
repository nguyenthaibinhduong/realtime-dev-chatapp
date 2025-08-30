const API_URL = "http://localhost:3088/v1/api";

const AUTH_API = {
  //Login normal
  LOGIN: `${API_URL}/auth/login`,
  REGISTER: `${API_URL}/auth/register`,
  LOGOUT: `${API_URL}/auth/logout`,
  REFRESH: `${API_URL}/auth/refresh-token`,
  VERIFY: `${API_URL}/auth/verify-token`,
  PROFILE: `${API_URL}/auth/get-profile`,
  //Login Github
};

export { API_URL, AUTH_API };
