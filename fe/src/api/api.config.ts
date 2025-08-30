const API_URL = "http://localhost:3088/v1/api";

const AUTH_API = {
  //Login normal
  LOGIN: `${API_URL}/auth/login`,
  REGISTER: `${API_URL}/auth/register`,
  REFRESH: `${API_URL}/auth/refresh-token`,
  VERIFY: `${API_URL}/auth/verify-token`,
  PROFILE: `${API_URL}/auth/get-profile`,
  GITHUB: {
    LOGIN: `${API_URL}/auth/github-oauth`,
  },
};

export { API_URL, AUTH_API };
