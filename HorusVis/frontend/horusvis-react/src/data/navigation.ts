export type SectionKey = "login" | "projects" | "my-tasks" | "reports" | "admin";

export type NavigationSection = {
  key: SectionKey;
  label: string;
  path: string;
  description: string;
  apiPath: string;
  accentClass: string;
};

export const sections: NavigationSection[] = [
  {
    key: "login",
    label: "Login",
    path: "/login",
    description: "Authentication and access entry points live here.",
    apiPath: "/api/auth/placeholder",
    accentClass: "accent-sunrise",
  },
  {
    key: "projects",
    label: "Projects",
    path: "/projects",
    description: "Project browsing, selection, and overview surfaces live here.",
    apiPath: "/api/projects/placeholder",
    accentClass: "accent-cobalt",
  },
  {
    key: "my-tasks",
    label: "My Tasks",
    path: "/my-tasks",
    description: "Personal work queues and execution workflows live here.",
    apiPath: "/api/my-tasks/placeholder",
    accentClass: "accent-mint",
  },
  {
    key: "reports",
    label: "Reports",
    path: "/reports",
    description: "Analytical and export-ready reporting views live here.",
    apiPath: "/api/reports/placeholder",
    accentClass: "accent-rose",
  },
  {
    key: "admin",
    label: "Admin",
    path: "/admin",
    description: "Configuration, permissions, and platform controls live here.",
    apiPath: "/api/admin/placeholder",
    accentClass: "accent-vault",
  },
];

export function getSectionByPath(pathname: string) {
  return sections.find((section) => section.path === pathname);
}
