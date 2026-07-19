import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "@context/AuthContext";
import { useAuth } from "@context/useAuth";
import QueryClientProvider from "@app/providers/QueryClientProvider.jsx";
import ErrorBoundary from "@shared/ui/ErrorBoundary.jsx";
import { Suspense, lazy } from "react";
import ToastContainer from "@widgets/notifications/ToastContainer.jsx";
import { useE2eeEnrollment } from "@features/e2ee/model/useE2eeEnrollment.js";
const Login = lazy(() => import("@pages/Login"));
const Register = lazy(() => import("@pages/Register"));
const Chat = lazy(() => import("@pages/Chat"));

const AppContent = () => {
  const { user } = useAuth();
  useE2eeEnrollment();

  return (
    <Suspense
      fallback={
        <div className="m3-surface h-screen w-full flex items-center justify-center text-sm text-muted-foreground">
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
      <ToastContainer />
    </Suspense>
  );
};

// Основной компонент, предоставляющий контекст
const App = () => {
  return (
    <QueryClientProvider>
      <AuthProvider>
        <Router
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
