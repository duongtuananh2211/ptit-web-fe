import type { PropsWithChildren, ReactNode } from "react";

type MainLayoutProps = PropsWithChildren<{
  title: string;
  eyebrow: string;
  description: string;
  sidebar: ReactNode;
  sidebarClassName?: string;
  toolbar?: ReactNode;
}>;

export default function MainLayout({
  title,
  eyebrow,
  description,
  sidebar,
  sidebarClassName,
  toolbar,
  children,
}: MainLayoutProps) {
  const resolvedSidebarClassName = sidebarClassName
    ? `sidebar ${sidebarClassName}`
    : "sidebar";

  return (
    <div className="app-shell">
      <aside className={resolvedSidebarClassName}>{sidebar}</aside>
      <main className="main-panel">
        <header className="hero">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {toolbar ? <div className="hero-toolbar">{toolbar}</div> : null}
        </header>
        <section className="content-frame">{children}</section>
      </main>
    </div>
  );
}
