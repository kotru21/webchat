import axios from "axios";
import { API } from "@constants/appConstants";
import {
  clearAccessToken,
  getAccessToken,
} from "@shared/lib/accessToken";
import {
  clearRefreshSessionFlag,
  hasRefreshSessionFlag,
  refreshAccessToken,
} from "@shared/lib/refreshSession";

export const apiClient = axios.create({
  baseURL: API.BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const clearSessionAndRedirect = () => {
  clearAccessToken();
  clearRefreshSessionFlag();
  window.location.href = "/login";
};

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (!config.headers) {
    config.headers = {};
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const responseMessage =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.msg ||
      error.message;

    if (!status || status >= 500) {
      console.error("API Error:", {
        endpoint: error.config?.url,
        method: error.config?.method,
        status,
        message: responseMessage,
      });
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (!hasRefreshSessionFlag()) {
          throw new Error("NO_REFRESH_SESSION");
        }

        const newToken = await refreshAccessToken();
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearSessionAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
