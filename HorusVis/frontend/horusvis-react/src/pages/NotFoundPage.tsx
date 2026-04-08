import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="standalone-page">
      <article className="panel-card panel-secondary standalone-card">
        <span className="status-pill">404</span>
        <h1>Route not found</h1>
        <p>This path is outside the current HorusVis scaffold.</p>
        <Link className="ghost-link" to="/login">
          Return to Login
        </Link>
      </article>
    </main>
  );
}
