import { createContext, useContext } from "react";

export type AuthStoreContext = {
  accessToken: string | null;
  userRole: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
};

export const AuthStoreContext = createContext<AuthStoreContext | null>(null);

export function useAuthStore() {
  const store = useContext(AuthStoreContext);

  if (store === null) {
    throw new Error("useAuthStore must be used within AuthStoreProvider.");
  }

  return store;
}
