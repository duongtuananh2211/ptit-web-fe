import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store-context";

export default function RequireAdminRole() {
  const { userRole } = useAuthStore();

  if (userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
