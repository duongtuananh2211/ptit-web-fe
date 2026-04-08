import { type PropsWithChildren, useState } from "react";
import { AuthStoreContext } from "./auth-store-context";

export function AuthStoreProvider({ children }: PropsWithChildren) {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("access_token"),
  );
  const [userRole, setUserRole] = useState<string | null>(
    localStorage.getItem("user_role"),
  );

  function login(token: string, role: string) {
    setAccessToken(token);
    setUserRole(role);
    localStorage.setItem("access_token", token);
    localStorage.setItem("user_role", role);
  }

  function logout() {
    setAccessToken(null);
    setUserRole(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
  }

  return (
    <AuthStoreContext.Provider value={{ accessToken, userRole, login, logout }}>
      {children}
    </AuthStoreContext.Provider>
  );
}
