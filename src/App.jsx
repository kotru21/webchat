import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "@context/AuthContext";
import { useAuth } from "@context/useAuth";
import QueryClientProvider from "@app/providers/QueryClientProvider.jsx";
import { Suspense, lazy } from "react";
const Login = lazy(() => import("@pages/Login"));
const Register = lazy(() => import("@pages/Register"));
const Chat = lazy(() => import("@pages/Chat"));

const AppContent = () => {
  const { user } = useAuth();

  // Обработка закрытия окна или выхода со страницы
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      // Синхронный запрос для гарантированной отправки при закрытии
      const xhr = new XMLHttpRequest();
      xhr.open(
        "PUT",
        `${import.meta.env.VITE_API_URL}/api/status/update`,
        false
      );
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader(
        "Authorization",
        `Bearer ${localStorage.getItem("token")}`
      );
      xhr.send(JSON.stringify({ status: "offline" }));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user]);

  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          Загрузка...
        </div>
      }>
      <Routes>
        <Route
          path="/"
          element={user ? <Chat /> : <Navigate to="/login" replace />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Suspense>
  );
};

// Основной компонент, предоставляющий контекст
const App = () => {
  return (
    <QueryClientProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
