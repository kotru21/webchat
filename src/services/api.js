import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", {
      endpoint: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post(
        "/api/auth/login",
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Login Error:", {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
      throw error;
    }
  },
  register: async (formData) => {
    try {
      const response = await api.post("/api/auth/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Register Error:", error);
      throw error;
    }
  },
  updateProfile: async (formData) => {
    try {
      const response = await api.put("/api/auth/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Update Profile Error:", error);
      throw error;
    }
  },
};

export const messageService = {
  getMessages: async (receiverId = null) => {
    try {
      const url = receiverId
        ? `/api/messages?receiverId=${receiverId}`
        : "/api/messages";
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Get Messages Error:", error);
      throw error;
    }
  },
  sendMessage: async (formData) => {
    try {
      const response = await api.post("/api/messages", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Send Message Error:", error.response?.data || error);
      throw error;
    }
  },
  markMessageAsRead: async (messageId) => {
    try {
      const response = await api.post(`/api/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error("Mark as read error:", error);
      throw error;
    }
  },
  updateMessage: async (messageId, formData) => {
    try {
      const response = await api.put(`/api/messages/${messageId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Update Message Error:", error);
      throw error;
    }
  },
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/api/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error("Delete Message Error:", error);
      throw error;
    }
  },
  pinMessage: async (messageId, isPinned) => {
    const response = await api.put(`/api/messages/${messageId}/pin`, {
      isPinned,
    });
    return response.data;
  },
};

export const statusService = {
  getUserStatus: async (userId) => {
    try {
      const response = await api.get(`/api/status/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Get Status Error:", error);
      throw error;
    }
  },
  updateStatus: async (statusData) => {
    try {
      const response = await api.put("/api/status/update", statusData);
      return response.data;
    } catch (error) {
      console.error("Update Status Error:", error);
      throw error;
    }
  },
  updateActivity: async () => {
    try {
      const response = await api.put("/api/status/activity");
      return response.data;
    } catch (error) {
      console.error("Update Activity Error:", error);
      return null; // Тихая ошибка
    }
  },
};

export const { login, register, updateProfile } = authService;

export const {
  getMessages,
  sendMessage,
  markMessageAsRead,
  updateMessage,
  deleteMessage,
  pinMessage,
} = messageService;

export const { getUserStatus, updateStatus, updateActivity } = statusService;

export default api;
