import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { AppShellStoreProvider } from "../stores/app-shell-store";
import { AuthStoreProvider } from "../stores/auth-store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthStoreProvider>
        <AppShellStoreProvider>{children}</AppShellStoreProvider>
      </AuthStoreProvider>
    </QueryClientProvider>
  );
}
