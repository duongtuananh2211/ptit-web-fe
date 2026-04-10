import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authService } from "../services/authService";

interface GuardProps {
  children: ReactNode;
}

export const RequireAuth = ({ children }: GuardProps) => {
  const location = useLocation();

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export const RedirectIfAuthenticated = ({ children }: GuardProps) => {
  if (authService.isAuthenticated()) {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
};

export const RequireAdmin = ({ children }: GuardProps) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!authService.isAdmin()) {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
};

