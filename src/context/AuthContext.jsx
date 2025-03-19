import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
} from "react";
import { USER_STATUSES } from "../constants/statusConstants";
import statusService from "../services/statusService";
import api from "../services/api";

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

const normalizeUser = (userData) => {
  if (!userData) return null;
  return {
    ...userData,
    id: userData._id || userData.id, // преобразование _id в id
  };
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
  });

  const [userStatus, setUserStatus] = useState(state.user?.status || "offline");

  // Загрузка данных из localStorage при старте
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const normalizedUser = normalizeUser(parsedUser);
        dispatch({ type: "LOGIN", payload: normalizedUser });
        if (parsedUser.status) {
          setUserStatus(parsedUser.status);
        }
      } catch (error) {
        console.error("Ошибка парсинга данных из localStorage:", error);
        localStorage.removeItem("user");
        dispatch({ type: "LOGOUT" });
      }
    } else {
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  // Принцип SRP: разделение ответственности для аутентификации
  const login = async (userData, token) => {
    const normalizedUser = normalizeUser(userData);
    dispatch({ type: "LOGIN", payload: normalizedUser });
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    // Устанавливаем статус при входе
    try {
      await statusService.updateStatus(USER_STATUSES.ONLINE);
      setUserStatus(USER_STATUSES.ONLINE);
    } catch (error) {
      console.error("Ошибка при установке статуса online:", error);
    }
  };

  // Обновление профиля
  const updateUser = (updatedUser) => {
    const normalizedUser = normalizeUser(updatedUser);
    dispatch({ type: "UPDATE_PROFILE", payload: normalizedUser });
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  // Выход из системы
  const logout = async () => {
    try {
      // Устанавливаем статус offline перед выходом
      await statusService.setOfflineStatus();

      // Выполняем выход на сервере
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    } finally {
      // Всегда выполняем локальный выход
      dispatch({ type: "LOGOUT" });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  // Обработчик изменения статуса
  const handleStatusChange = async (newStatus) => {
    try {
      await statusService.updateStatus(newStatus);
      setUserStatus(newStatus);

      // Обновляем пользователя
      dispatch({
        type: "UPDATE_PROFILE",
        payload: { status: newStatus },
      });
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        login,
        logout,
        updateUser,
        loading: state.loading,
        userStatus,
        handleStatusChange,
      }}>
      {!state.loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth должен использоваться внутри AuthProvider");
  }
  return context;
};
