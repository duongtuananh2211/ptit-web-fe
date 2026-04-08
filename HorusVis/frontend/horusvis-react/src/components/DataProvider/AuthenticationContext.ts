import { createContext } from "react";
import { Authenticator } from "./authenticator";

export const AuthenticationContext = createContext(null as unknown as Authenticator);
