import { type PropsWithChildren } from "react";
import { AuthenticationProvider } from "./AuthenticationProvider";
import { HorusVisClientProvider } from "./HorusVisClientProvider";

export function DataProvider({ children }: PropsWithChildren) {
  return (
    <AuthenticationProvider>
      <HorusVisClientProvider>{children}</HorusVisClientProvider>
    </AuthenticationProvider>
  );
}
