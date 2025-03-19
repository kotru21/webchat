import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

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
    <Routes>
      <Route
        path="/"
        element={user ? <Chat /> : <Navigate to="/login" replace />}
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
};

// Основной компонент, предоставляющий контекст
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
