import { createContext, useContext } from "react";

export type AppShellStoreValue = {
  apiBaseUrl: string;
  closeSidebar: () => void;
  environmentLabel: string;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};

export const AppShellStoreContext = createContext<AppShellStoreValue | null>(null);

export function useAppShellStore() {
  const store = useContext(AppShellStoreContext);

  if (store === null) {
    throw new Error("useAppShellStore must be used within AppShellStoreProvider.");
  }

  return store;
}
