import { useContext } from "react";
import { AuthContext } from "./AuthContextBase";

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuth должен использоваться внутри AuthProvider");
  return ctx;
};

export default useAuth;
