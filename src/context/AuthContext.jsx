import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Функция для нормализации данных пользователя
  const normalizeUser = (userData) => {
    return {
      ...userData,
      id: userData._id,
    };
  };

  // Загрузка данных пользователя из localStorage при монтировании компонента
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      const normalizedUser = normalizeUser(parsedUser);
      setUser(normalizedUser);
    }
    setLoading(false);
  }, []);

  // Функция входа в систему
  const login = (userData, token) => {
    const normalizedUser = normalizeUser(userData);
    setUser(normalizedUser);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  // Функция обновления данных пользователя
  const updateUser = (updatedUser) => {
    const normalizedUser = normalizeUser(updatedUser);
    setUser(normalizedUser);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  // Функция выхода из системы
  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
