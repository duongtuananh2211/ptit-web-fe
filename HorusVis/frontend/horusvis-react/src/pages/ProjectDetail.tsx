import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  projectsService,
  type ProjectBoardTasks,
  type ProjectSummary,
} from "../services/projectsService";
import TaskBoard from "../components/TaskBoard";

const formatDateTime = (value: string) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString();
};

const ProjectDetail = () => {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [boardTasks, setBoardTasks] = useState<ProjectBoardTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(true);
  const [error, setError] = useState("");
  const [boardError, setBoardError] = useState("");

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        setError("Missing project id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [projectResponse, boardResponse] = await Promise.all([
          projectsService.getProjectById(projectId),
          projectsService.getProjectBoardPreview(projectId).catch((err) => {
            setBoardError(
              err instanceof Error
                ? err.message
                : "Failed to load project board preview.",
            );
            return null;
          }),
        ]);

        setProject(projectResponse);
        setBoardTasks(boardResponse);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load project.",
        );
      } finally {
        setLoading(false);
        setBoardLoading(false);
      }
    };

    void loadProject();
  }, [projectId]);

  return (
    <div className="space-y-8">
      <section className="flex flex-col">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 text-xs font-label uppercase tracking-widest text-outline mb-2">
              <button
                type="button"
                onClick={() => navigate("/projects")}
                className="hover:text-on-surface transition-colors"
              >
                Projects
              </button>
              <span className="material-symbols-outlined text-xs">
                chevron_right
              </span>
              <span className="text-on-surface">
                {project?.title || (loading ? "Loading" : "Detail")}
              </span>
            </nav>
            <h2 className="text-3xl font-black text-on-surface tracking-tight font-headline editorial-tight">
              Project Detail
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {projectId && (
              <button
                type="button"
                onClick={() => navigate(`/projects/${projectId}/edit`)}
                className="flex items-center gap-2 px-4 py-2 primary-gradient text-on-primary font-semibold rounded-xl shadow-sm hover:scale-102 active:scale-98 transition-all"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                <span className="text-sm">Edit Project</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface font-semibold rounded-xl hover:bg-surface-container-highest transition-all"
            >
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
              <span className="text-sm">Back to List</span>
            </button>
          </div>
        </div>
        <div className="h-px w-full bg-surface-container-highest mt-6"></div>
      </section>

      {loading && (
        <div className="rounded-2xl bg-surface-container-low p-6 text-on-surface-variant">
          Loading project detail...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl bg-error-container p-4 text-sm text-error">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        </div>
      )}

      {!loading && !error && project && (
        <section className="space-y-6">
          <article className="rounded-2xl border border-slate-100/70 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black text-on-surface editorial-tight">
                  {project.title}
                </h3>
                {project.code && (
                  <p className="text-xs text-outline uppercase tracking-widest mt-1">
                    {project.code}
                  </p>
                )}
              </div>
              <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                {project.status}
              </span>
            </div>

            <p className="mt-4 text-sm text-on-surface-variant leading-relaxed">
              {project.description || "No project description available."}
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-xs text-outline uppercase tracking-wider">
                  Members
                </p>
                <p className="text-2xl font-black text-on-surface mt-1">
                  {project.memberCount}
                </p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-xs text-outline uppercase tracking-wider">
                  Tasks
                </p>
                <p className="text-2xl font-black text-on-surface mt-1">
                  {project.taskCount}
                </p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-xs text-outline uppercase tracking-wider">
                  Created
                </p>
                <p className="text-sm font-semibold text-on-surface mt-2">
                  {formatDateTime(project.createdAt)}
                </p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-xs text-outline uppercase tracking-wider">
                  Updated
                </p>
                <p className="text-sm font-semibold text-on-surface mt-2">
                  {formatDateTime(project.updatedAt)}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-100/70 bg-surface-container-low p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-lg font-black text-on-surface editorial-tight">
                Project Board
              </h4>
              <span className="text-xs text-on-surface-variant uppercase tracking-wider">
                BoardColumn UI
              </span>
            </div>

            {boardLoading && (
              <p className="text-sm text-on-surface-variant">
                Loading board preview...
              </p>
            )}

            {!boardLoading && boardError && (
              <p className="text-sm text-error">{boardError}</p>
            )}

            {!boardLoading && !boardError && boardTasks && (
              <TaskBoard initialTasks={boardTasks} />
            )}

            {!boardLoading && !boardError && !boardTasks && (
              <p className="text-sm text-on-surface-variant">
                Board data is not available for this project yet.
              </p>
            )}
          </article>
        </section>
      )}
    </div>
  );
};

export default ProjectDetail;

