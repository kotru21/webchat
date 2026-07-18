import apiClient from "@shared/api/client";

export async function login(email, password) {
  const res = await apiClient.post("/api/auth/login", { email, password });
  return res.data;
}

export async function register(formData) {
  const res = await apiClient.post("/api/auth/register", formData);
  return res.data;
}

export async function updateProfile(formData) {
  const res = await apiClient.put("/api/auth/profile", formData);
  return res.data;
}

export async function searchUsers(q) {
  const res = await apiClient.get("/api/auth/users", {
    params: { q },
  });
  return res.data;
}

export default { login, register, updateProfile, searchUsers };
