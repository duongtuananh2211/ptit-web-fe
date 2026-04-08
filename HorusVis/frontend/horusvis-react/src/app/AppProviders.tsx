import type { PropsWithChildren } from "react";
import { AppShellStoreProvider } from "../stores/app-shell-store";

export default function AppProviders({ children }: PropsWithChildren) {
  return <AppShellStoreProvider>{children}</AppShellStoreProvider>;
}
