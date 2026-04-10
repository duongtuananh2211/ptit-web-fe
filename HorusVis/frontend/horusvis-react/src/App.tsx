import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import AuthLayout from "./components/AuthLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectCreate from "./pages/ProjectCreate";
import ProjectEdit from "./pages/ProjectEdit";
import ProjectMembers from "./pages/ProjectMembers";
import MyTasks from "./pages/MyTasks";
import Reports from "./pages/Reports";
import Admin from "./pages/Admin";
import AdminCreateUser from "./pages/AdminCreateUser";
import AdminEditUser from "./pages/AdminEditUser";
import {
  RedirectIfAuthenticated,
  RequireAdmin,
  RequireAuth,
} from "./components/RouteGuards";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <Login />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/register"
            element={
              <RedirectIfAuthenticated>
                <Register />
              </RedirectIfAuthenticated>
            }
          />
        </Route>
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/new" element={<ProjectCreate />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/projects/:projectId/edit" element={<ProjectEdit />} />
          <Route
            path="/projects/:projectId/members"
            element={<ProjectMembers />}
          />
          <Route path="/tasks" element={<MyTasks />} />
          <Route path="/reports" element={<Reports />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/users/new"
            element={
              <RequireAdmin>
                <AdminCreateUser />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/users/:userId/edit"
            element={
              <RequireAdmin>
                <AdminEditUser />
              </RequireAdmin>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

