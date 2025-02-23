import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Добавляем токен к каждому запросу
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

export const login = async (email, password) => {
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
};

export const register = async (formData) => {
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
};

// Добавляем функцию получения сообщений
export const getMessages = async (receiverId = null) => {
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
};

// Добавляем функцию отправки сообщения
export const sendMessage = async (formData) => {
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
};

// Добавляем функцию отметки сообщения как прочитанного
export const markMessageAsRead = async (messageId) => {
  try {
    const response = await api.post(`/api/messages/${messageId}/read`);
    return response.data;
  } catch (error) {
    console.error("Mark as read error:", error);
    throw error;
  }
};

export const updateMessage = async (messageId, formData) => {
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
};

export const deleteMessage = async (messageId) => {
  try {
    const response = await api.delete(`/api/messages/${messageId}`);
    return response.data;
  } catch (error) {
    console.error("Delete Message Error:", error);
    throw error;
  }
};

export const updateProfile = async (formData) => {
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
};

export default api;
