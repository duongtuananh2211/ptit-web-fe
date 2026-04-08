import { useContext } from "react";
import { AuthenticationContext } from "./AuthenticationContext";
import { HorusVisClientContext } from "./HorusVisClientContext";

export function useAuthentication() {
  return useContext(AuthenticationContext);
}

export function useHorusVisClient() {
  return useContext(HorusVisClientContext);
}
