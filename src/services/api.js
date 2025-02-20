import axios from "axios";

const API_URL = "http://192.168.95.229:5000";

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

export const register = async (username, email, password) => {
  const response = await api.post("/api/auth/register", {
    username,
    email,
    password,
  });
  return response.data;
};

export default api;
