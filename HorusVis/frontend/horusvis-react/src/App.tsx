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
import MyTasks from "./pages/MyTasks";
import Reports from "./pages/Reports";
import Admin from "./pages/Admin";
import AdminCreateUser from "./pages/AdminCreateUser";
import AdminEditUser from "./pages/AdminEditUser";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<Layout />}>
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<MyTasks />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/users/new" element={<AdminCreateUser />} />
          <Route path="/admin/users/:userId/edit" element={<AdminEditUser />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

