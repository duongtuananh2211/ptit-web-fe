type FeaturePageProps = {
  accentClass: string;
  description: string;
  endpoint: string;
  notes: string[];
  title: string;
};

export default function FeaturePage({
  accentClass,
  description,
  endpoint,
  notes,
  title,
}: FeaturePageProps) {
  return (
    <div className="page-stack">
      <article className={`panel-card ${accentClass}`}>
        <span className="status-pill">Feature scaffold</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </article>

      <article className="panel-card panel-secondary">
        <div className="meta-grid">
          <div>
            <span className="meta-label">API placeholder</span>
            <strong>{endpoint}</strong>
          </div>
          <div>
            <span className="meta-label">State</span>
            <strong>UI shell ready</strong>
          </div>
        </div>

        <ul className="note-list">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}
