import { useReducer, useEffect } from "react";
import { authReducer, normalizeUser } from "@features/auth/model/authState";
import apiClient from "@shared/api/client";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@shared/lib/accessToken";
import {
  clearRefreshSessionFlag,
  hasRefreshSessionFlag,
  refreshAccessToken,
} from "@shared/lib/refreshSession";
import { AuthContext } from "./AuthContextBase";

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      // Avoid POST /api/auth/refresh when there is clearly no session.
      if (!hasRefreshSessionFlag()) {
        if (!cancelled) {
          clearAccessToken();
          dispatch({ type: "LOGOUT" });
        }
        return;
      }

      try {
        // Single-flight refresh restores in-memory access token.
        const token = await refreshAccessToken();
        if (cancelled) return;
        setAccessToken(token);
        const me = await apiClient.get("/api/auth/me");
        if (cancelled) return;
        dispatch({ type: "LOGIN", payload: normalizeUser(me.data) });
      } catch {
        if (cancelled) return;
        clearAccessToken();
        clearRefreshSessionFlag();
        dispatch({ type: "LOGOUT" });
      }
    };

    if (getAccessToken()) {
      apiClient
        .get("/api/auth/me")
        .then((me) => {
          if (!cancelled) {
            dispatch({ type: "LOGIN", payload: normalizeUser(me.data) });
          }
        })
        .catch(() => {
          if (!cancelled) {
            clearAccessToken();
            dispatch({ type: "LOGOUT" });
          }
        });
    } else {
      bootstrap();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (userData, token) => {
    const normalizedUser = normalizeUser(userData);
    setAccessToken(token);
    dispatch({ type: "LOGIN", payload: normalizedUser });
  };

  const updateUser = (updatedUser) => {
    const normalizedUser = normalizeUser(updatedUser);
    dispatch({ type: "UPDATE_PROFILE", payload: normalizedUser });
  };

  const logout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    } finally {
      clearAccessToken();
      clearRefreshSessionFlag();
      dispatch({ type: "LOGOUT" });
    }
  };

  const logoutAll = async () => {
    try {
      await apiClient.post("/api/auth/logout-all");
    } catch (error) {
      console.error("Ошибка при выходе со всех устройств:", error);
    } finally {
      clearAccessToken();
      clearRefreshSessionFlag();
      dispatch({ type: "LOGOUT" });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        login,
        logout,
        logoutAll,
        updateUser,
        loading: state.loading,
      }}>
      {!state.loading && children}
    </AuthContext.Provider>
  );
};
