import { Navigate, createBrowserRouter } from "react-router-dom";
import AppShell from "./AppShell";
import RequireAdminRole from "./RequireAdminRole";
import AdminPage from "../pages/AdminPage";
import LoginPage from "../pages/LoginPage";
import MyTasksPage from "../pages/MyTasksPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProjectsPage from "../pages/ProjectsPage";
import ReportsPage from "../pages/ReportsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate replace to="/login" />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/projects",
        element: <ProjectsPage />,
      },
      {
        path: "/my-tasks",
        element: <MyTasksPage />,
      },
      {
        path: "/reports",
        element: <ReportsPage />,
      },
      {
        element: <RequireAdminRole />,
        children: [{ path: "/admin", element: <AdminPage /> }],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
