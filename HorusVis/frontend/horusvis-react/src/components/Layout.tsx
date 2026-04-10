import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

const Layout = () => {
  const navigate = useNavigate();
  const isAdmin = authService.isAdmin();

  const navItems = [
    { name: "Projects", icon: "folder_open", path: "/projects" },
    { name: "My Tasks", icon: "assignment_turned_in", path: "/tasks" },
    ...(isAdmin ? [{ name: "Admin", icon: "settings", path: "/admin" }] : []),
  ];

  const handleLogout = () => {
    authService.clearToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="bg-surface font-body text-on-surface flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full flex flex-col p-4 z-50 w-64 border-r border-slate-200/50 bg-[#f1f3ff]/90 glass-sidebar">
        <div className="mb-8 px-4">
          <h1 className="text-lg font-bold text-[#141b2c] editorial-tight">
            HorusVis
          </h1>
          <p className="text-xs text-secondary font-medium label-wide">
            Project Management
          </p>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 font-['Inter'] text-sm tracking-wide transition-all rounded-lg ${
                  isActive
                    ? "text-[#0052CC] font-semibold bg-white shadow-sm transform scale-102"
                    : "text-slate-600 hover:text-[#0052CC] hover:bg-white/50"
                }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 ml-64 min-h-screen">
        {/* TopNavBar */}
        <header className="flex justify-between items-center px-6 w-full sticky top-0 z-40 h-16 border-b border-slate-100 bg-[#ffffff] transition-colors">
          <div className="flex items-center gap-6"></div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-slate-50 hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

