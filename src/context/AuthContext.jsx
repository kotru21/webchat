import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Функция нормализации данных пользователя
  const normalizeUser = (userData) => {
    return {
      ...userData,
      id: userData._id || userData.id, // преобразование _id в id
    };
  };

  // Загрузка данных из localStorage при старте
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const normalizedUser = normalizeUser(parsedUser);
        setUser(normalizedUser);
      } catch (error) {
        console.error("Ошибка парсинга данных из localStorage:", error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // Вход в систему
  const login = (userData, token) => {
    const normalizedUser = normalizeUser(userData);
    setUser(normalizedUser);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  // Обновление профиля
  const updateUser = (updatedUser) => {
    const normalizedUser = normalizeUser(updatedUser);
    setUser(normalizedUser);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  // Выход из системы
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
