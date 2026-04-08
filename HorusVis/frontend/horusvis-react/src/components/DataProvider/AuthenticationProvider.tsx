import { type PropsWithChildren, useMemo, useRef } from "react";
import { Authenticator } from "./authenticator";
import { AuthenticationContext } from "./AuthenticationContext";
import { useAuthStore } from "../../stores/auth-store-context";

export function AuthenticationProvider({ children }: PropsWithChildren) {
  const { accessToken, logout } = useAuthStore();

  // Use a ref so the authenticator doesn't recreate on every logout reference change
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const authenticator = useMemo(() => {
    const auth = new Authenticator(accessToken ?? "");
    auth.addEventListener("tokenExpired", () => logoutRef.current());
    auth.addEventListener("authError", () => logoutRef.current());
    return auth;
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return <AuthenticationContext.Provider value={authenticator}>{children}</AuthenticationContext.Provider>;
}
