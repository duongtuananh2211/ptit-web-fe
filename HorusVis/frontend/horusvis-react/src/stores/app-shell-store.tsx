import { type PropsWithChildren, useState } from "react";
import { getApiBaseUrl } from "../lib/env";
import { AppShellStoreContext } from "./app-shell-store-context";

export function AppShellStoreProvider({ children }: PropsWithChildren) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppShellStoreContext.Provider
      value={{
        apiBaseUrl: getApiBaseUrl(),
        closeSidebar: () => setSidebarOpen(false),
        environmentLabel: import.meta.env.MODE,
        sidebarOpen,
        toggleSidebar: () => setSidebarOpen((current) => !current),
      }}
    >
      {children}
    </AppShellStoreContext.Provider>
  );
}
