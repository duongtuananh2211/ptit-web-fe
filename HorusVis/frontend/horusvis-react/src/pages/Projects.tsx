import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  projectsService,
  type ProjectSummary,
} from "../services/projectsService";

const getStatusBadge = (status: string) => {
  const normalized = status.toLowerCase();

  if (normalized.includes("archive")) {
    return "bg-slate-100 text-slate-600";
  }

  if (normalized.includes("done") || normalized.includes("complete")) {
    return "bg-green-100 text-green-700";
  }

  if (normalized.includes("risk") || normalized.includes("block")) {
    return "bg-red-100 text-red-700";
  }

  return "bg-blue-100 text-blue-700";
};

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await projectsService.listProjects();
        setProjects(response);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load projects.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProjects();
  }, []);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-on-surface editorial-tight">
              Projects Portfolio
            </h2>
            <p className="text-on-surface-variant mt-1">
              Browse all projects from the API and open each project detail.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/projects/new")}
              className="flex items-center gap-2 px-4 py-2 primary-gradient text-on-primary font-semibold rounded-xl shadow-sm hover:scale-102 active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span className="text-sm">New Project</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError("");
                void projectsService
                  .listProjects()
                  .then(setProjects)
                  .catch((err) => {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Failed to load projects.",
                    );
                  })
                  .finally(() => setLoading(false));
              }}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface font-semibold rounded-xl hover:bg-surface-container-highest transition-all"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              <span className="text-sm">Refresh</span>
            </button>
          </div>
        </div>
        <div className="h-px w-full bg-surface-container-highest"></div>
      </section>

      {error && (
        <div className="rounded-xl bg-error-container p-4 text-sm text-error">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="lg:col-span-3 rounded-2xl bg-surface-container-low p-6 text-on-surface-variant">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="lg:col-span-3 rounded-2xl bg-surface-container-low p-6 text-on-surface-variant">
            No projects found.
          </div>
        ) : (
          projects.map((project) => (
            <article
              key={project.id}
              className="rounded-2xl border border-slate-100/70 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black min-h-[56px] text-on-surface editorial-tight">
                    {project.title}
                  </h3>
                  {project.code && (
                    <p className="text-xs text-outline uppercase tracking-widest mt-1">
                      {project.code}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getStatusBadge(project.status)}`}
                >
                  {project.status}
                </span>
              </div>

              <p className="text-sm text-on-surface-variant mt-3 min-h-12">
                {project.description || "No project description available."}
              </p>

              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${project.id}/edit`)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-surface-container-high text-on-surface text-sm font-bold border border-outline/20 hover:bg-surface-container-highest transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      edit
                    </span>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg primary-gradient text-on-primary text-sm font-bold shadow-sm hover:scale-102 active:scale-98 transition-all"
                  >
                    Open
                    <span className="material-symbols-outlined text-base">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};

export default Projects;

