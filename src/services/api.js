import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

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
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  try {
    const response = await api.post("/api/auth/login", { email, password });
    return response.data;
  } catch (error) {
    console.error("Login Error:", error);
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
export const getMessages = async () => {
  try {
    const response = await api.get("/api/messages");
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

export default api;
