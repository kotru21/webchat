import axios from "axios";

const API_URL = "http://192.168.0.105:5000"; // Ваш IP-адрес

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  withCredentials: false, // Изменяем на false
});

// Добавляем перехватчик для установки токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (email, password) => {
  const response = await api.post("/api/auth/login", { email, password });
  return response.data;
};

export const register = async (username, email, password) => {
  const response = await api.post("/api/auth/register", {
    username,
    email,
    password,
  });
  return response.data;
};

export default api;
