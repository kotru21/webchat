import { createContext, useContext, useReducer, useEffect } from "react";

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.payload, loading: false };
    case "LOGOUT":
      return { ...state, user: null, loading: false };
    case "UPDATE_PROFILE":
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
  });

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
        dispatch({ type: "LOGIN", payload: normalizedUser });
      } catch (error) {
        console.error("Ошибка парсинга данных из localStorage:", error);
        localStorage.removeItem("user");
      }
    } else {
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  // Вход в систему
  const login = (userData, token) => {
    const normalizedUser = normalizeUser(userData);
    dispatch({ type: "LOGIN", payload: normalizedUser });
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  // Обновление профиля
  const updateUser = (updatedUser) => {
    const normalizedUser = normalizeUser(updatedUser);
    dispatch({ type: "UPDATE_PROFILE", payload: normalizedUser });
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  // Выход из системы
  const logout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        login,
        updateUser,
        logout,
        loading: state.loading,
      }}>
      {!state.loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
