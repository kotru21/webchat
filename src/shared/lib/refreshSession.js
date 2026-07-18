import axios from "axios";
import { API } from "@constants/appConstants";
import {
  clearAccessToken,
  setAccessToken,
} from "@shared/lib/accessToken";

const FLAG_NAME = "hasRefreshSession";

/** Single-flight: Strict Mode double-mount must not rotate twice. */
let inFlightRefresh = null;

export const hasRefreshSessionFlag = () =>
  typeof document !== "undefined" &&
  document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${FLAG_NAME}=`));

export const clearRefreshSessionFlag = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${FLAG_NAME}=; Max-Age=0; Path=/`;
};

/**
 * Cookie-based access-token refresh. Dedupes concurrent callers so React
 * Strict Mode does not trigger refresh-token reuse detection.
 * @returns {Promise<string>} new access token
 */
export const refreshAccessToken = () => {
  if (!hasRefreshSessionFlag()) {
    return Promise.reject(new Error("NO_REFRESH_SESSION"));
  }

  if (!inFlightRefresh) {
    inFlightRefresh = axios
      .post(`${API.BASE_URL}/api/auth/refresh`, null, {
        withCredentials: true,
      })
      .then((response) => {
        const token = response.data.token;
        setAccessToken(token);
        return token;
      })
      .catch((error) => {
        clearRefreshSessionFlag();
        clearAccessToken();
        throw error;
      })
      .finally(() => {
        inFlightRefresh = null;
      });
  }

  return inFlightRefresh;
};
