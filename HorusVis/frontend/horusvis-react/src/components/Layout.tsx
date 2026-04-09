import { NavLink, Outlet } from "react-router-dom";
import { authService } from "../services/authService";

const Layout = () => {
  const isAdmin = authService.isAdmin();

  const navItems = [
    { name: "Projects", icon: "folder_open", path: "/projects" },
    { name: "My Tasks", icon: "assignment_turned_in", path: "/tasks" },
    { name: "Reports", icon: "bar_chart", path: "/reports" },
    ...(isAdmin ? [{ name: "Admin", icon: "settings", path: "/admin" }] : []),
  ];

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
        <div className="mt-auto border-t border-slate-200/50 pt-4 space-y-2">
          <button className="flex items-center w-full gap-3 px-4 py-3 text-slate-600 font-['Inter'] text-sm tracking-wide hover:text-[#0052CC] hover:bg-white/50 rounded-lg transition-all text-left">
            <span className="material-symbols-outlined">help</span>
            Help
          </button>
          <button className="flex items-center w-full gap-3 px-4 py-3 text-slate-600 font-['Inter'] text-sm tracking-wide hover:text-[#0052CC] hover:bg-white/50 rounded-lg transition-all text-left">
            <span className="material-symbols-outlined">settings</span>
            Settings
          </button>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 ml-64 min-h-screen">
        {/* TopNavBar */}
        <header className="flex justify-between items-center px-6 w-full sticky top-0 z-40 h-16 border-b border-slate-100 bg-[#ffffff] transition-colors">
          <div className="flex items-center gap-6">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
                search
              </span>
              <input
                className="pl-10 pr-4 py-1.5 bg-surface-container-low border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-primary/20"
                placeholder="Search analytics..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-on-surface-variant hover:bg-slate-50 rounded-full transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant">
              <img
                alt="User profile"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQXnS2nzCK0iNE0Q3xLe86g-8UXyjnBVfOIxPAp2NhuPIQJ3wt-ppNPlg22SOzA8TJ1SO-ZZQmy3bc_V_-h7zJ3Av7d9rwUlC5fwQYgVqv-FB48qDT6XYwfbLFCACklgAMZtgdbntlg53m4Gj0jJEnF-uQtpcHudbPH12OCMdJBaO3WYLjRVLHjE3k5BFEedhO4YidaoIBfP7esDHpzPczMD1abXlcnGGPMrlv4rV6EW67zFy7s7acDVDU3bY4yDkk3y5NmlTDYo-w"
              />
            </div>
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

