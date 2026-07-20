import axios from "axios";

/**
 * Shared axios instance. When a real backend is available, set
 * NEXT_PUBLIC_API_URL and replace the mock services in `@/lib/api/services`
 * with calls through this client — hooks and components stay untouched.
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("lms.token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("lms.token");
    }
    return Promise.reject(error);
  }
);
