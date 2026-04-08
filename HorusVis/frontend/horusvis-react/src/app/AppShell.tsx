import { NavLink, Outlet, useLocation } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { getSectionByPath, sections } from "../data/navigation";
import { useAppShellStore } from "../stores/app-shell-store-context";

function SidebarNavigation() {
  const { apiBaseUrl, closeSidebar, environmentLabel } = useAppShellStore();

  return (
    <div>
      <div className="brand-block">
        <span className="brand-mark">HV</span>
        <div>
          <strong>HorusVis</strong>
          <p>Router scaffold</p>
        </div>
      </div>

      <div className="sidebar-meta">
        <span className="status-pill">{environmentLabel}</span>
        <span className="path-pill">{apiBaseUrl}</span>
      </div>

      <nav className="nav-list" aria-label="Feature navigation">
        {sections.map((section) => (
          <NavLink
            className={({ isActive }) =>
              isActive ? "nav-link is-active" : "nav-link"
            }
            key={section.key}
            onClick={closeSidebar}
            to={section.path}
          >
            <strong>{section.label}</strong>
            <span className="nav-meta">{section.description}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function AppShell() {
  const location = useLocation();
  const activeSection = getSectionByPath(location.pathname) ?? sections[0];
  const { sidebarOpen, toggleSidebar } = useAppShellStore();

  return (
    <MainLayout
      description={activeSection.description}
      eyebrow="npm + vite + react-router"
      sidebar={<SidebarNavigation />}
      sidebarClassName={sidebarOpen ? "is-open" : undefined}
      title={activeSection.label}
      toolbar={
        <button
          aria-expanded={sidebarOpen}
          className="menu-toggle"
          onClick={toggleSidebar}
          type="button"
        >
          Menu
        </button>
      }
    >
      <Outlet />
    </MainLayout>
  );
}
