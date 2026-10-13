import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 15000,
});

// A revoked or expired session should return the user to sign-in immediately.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const publicAuth = ["/auth/login", "/auth/register", "/auth/me"];
    if (
      error.response?.status === 401 &&
      !publicAuth.includes(error.config?.url)
    ) {
      window.dispatchEvent(new Event("session-expired"));
    }
    return Promise.reject(error);
  },
);
