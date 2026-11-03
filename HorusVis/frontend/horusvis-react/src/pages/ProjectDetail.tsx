import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ValidationError } from "yup";
import ActionToast from "../components/ActionToast";
import { FormSelect, FormTextArea, TextInput } from "../components/FormFields";
import {
  projectsService,
  type BoardTaskItem,
  type CreateTaskRequest,
  type ProjectMember,
  type ProjectBoardTasks,
  type ProjectSummary,
  type UpdateTaskRequest,
} from "../services/projectsService";
import { authService } from "../services/authService";
import { sprintsService, type Sprint } from "../services/sprintsService";
import TaskBoard from "../components/TaskBoard";
import {
  createTaskSchema,
  updateTaskSchema,
} from "../validation/projectSchema";

const TASK_PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"].map(
  (priority) => ({
    label: priority,
    value: priority,
  }),
);

const TASK_STATUS_OPTIONS = [
  { label: "To Do", value: "ToDo" },
  { label: "Working", value: "Working" },
  { label: "Stuck", value: "Stuck" },
  { label: "Done", value: "Done" },
];

const INITIAL_TASK_FORM: CreateTaskRequest = {
  projectId: "",
  title: "",
  description: "",
  priority: "Medium",
  assigneeUserId: "",
  sprintId: "",
  planEstimate: "",
};

type EditTaskForm = Omit<
  UpdateTaskRequest,
  "blockedNote" | "assigneeUserId"
> & {
  assigneeUserId: string;
  blockedNote: string;
};

const INITIAL_EDIT_TASK_FORM: EditTaskForm = {
  title: "",
  description: "",
  status: "ToDo",
  priority: "Medium",
  assigneeUserId: "",
  blockedNote: "",
  planEstimate: "",
  startDate: "",
  dueDate: "",
};

const ProjectDetail = () => {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();
  const isAdmin = authService.isAdmin();
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [boardTasks, setBoardTasks] = useState<ProjectBoardTasks | null>(null);
  const [boardRevision, setBoardRevision] = useState(0);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [editTaskSubmitting, setEditTaskSubmitting] = useState(false);
  const [taskForm, setTaskForm] =
    useState<CreateTaskRequest>(INITIAL_TASK_FORM);
  const [editTaskForm, setEditTaskForm] = useState<EditTaskForm>(
    INITIAL_EDIT_TASK_FORM,
  );
  const [taskFormErrors, setTaskFormErrors] = useState<
    Partial<Record<keyof CreateTaskRequest, string>>
  >({});
  const [editTaskFormErrors, setEditTaskFormErrors] = useState<
    Partial<Record<keyof EditTaskForm, string>>
  >({});
  const [editingTask, setEditingTask] = useState<BoardTaskItem | null>(null);
  const [error, setError] = useState("");
  const [boardError, setBoardError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const boardRequestId = useRef(0);

  const currentYear = new Date().getFullYear();
  const availableSprints = sprints.filter((sprint) => {
    const sprintStartYear = Number(sprint.startDate.slice(0, 4));
    const sprintEndYear = Number(sprint.endDate.slice(0, 4));
    return sprintStartYear <= currentYear + 1 && sprintEndYear >= currentYear;
  });
  const selectedSprint = availableSprints.find(
    (sprint) => sprint.id === selectedSprintId,
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const updateTaskField = <K extends keyof CreateTaskRequest>(
    key: K,
    value: CreateTaskRequest[K],
  ) => {
    setTaskForm((prev) => ({ ...prev, [key]: value }));
    setTaskFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const updateEditTaskField = <K extends keyof EditTaskForm>(
    key: K,
    value: EditTaskForm[K],
  ) => {
    setEditTaskForm((prev) => ({ ...prev, [key]: value }));
    setEditTaskFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const mapValidationErrors = (
    validationError: ValidationError,
  ): Partial<Record<keyof CreateTaskRequest, string>> => {
    const nextErrors: Partial<Record<keyof CreateTaskRequest, string>> = {};

    validationError.inner.forEach((entry) => {
      if (!entry.path) {
        return;
      }

      const key = entry.path as keyof CreateTaskRequest;
      if (!nextErrors[key]) {
        nextErrors[key] = entry.message;
      }
    });

    return nextErrors;
  };

  const mapEditValidationErrors = (
    validationError: ValidationError,
  ): Partial<Record<keyof EditTaskForm, string>> => {
    const nextErrors: Partial<Record<keyof EditTaskForm, string>> = {};

    validationError.inner.forEach((entry) => {
      if (!entry.path) {
        return;
      }

      const key = entry.path as keyof EditTaskForm;
      if (!nextErrors[key]) {
        nextErrors[key] = entry.message;
      }
    });

    return nextErrors;
  };

  const buildEditTaskForm = (task: BoardTaskItem): EditTaskForm => ({
    title: task.title ?? "",
    description: task.description ?? "",
    status: task.status || "ToDo",
    priority: task.priority || "Medium",
    assigneeUserId: task.assigneeUserId ?? "",
    blockedNote: task.blockedNote ?? "",
    planEstimate:
      task.planEstimate !== undefined && task.planEstimate !== null
        ? String(task.planEstimate)
        : "",
    startDate: task.startDate ?? "",
    dueDate: task.dueDate ?? "",
  });

  const openEditTaskModal = (task: BoardTaskItem) => {
    setEditingTask(task);
    setEditTaskForm(buildEditTaskForm(task));
    setEditTaskFormErrors({});
    setTaskError("");
    setEditModalOpen(true);
  };

  const loadBoardPreview = useCallback(async (
    targetProjectId: string,
    targetSprintId: string,
  ) => {
    const requestId = ++boardRequestId.current;
    setBoardLoading(true);
    setBoardError("");

    if (!targetSprintId) {
      setBoardTasks(null);
      setBoardLoading(false);
      return;
    }

    try {
      const boardResponse =
        await projectsService.getProjectBoardPreview(
          targetProjectId,
          targetSprintId,
        );
      if (requestId === boardRequestId.current) {
        setBoardTasks(boardResponse);
        setBoardRevision((revision) => revision + 1);
      }
    } catch (err) {
      if (requestId === boardRequestId.current) {
        setBoardTasks(null);
        setBoardError(
          err instanceof Error
            ? err.message
            : "Failed to load project board preview.",
        );
      }
    } finally {
      if (requestId === boardRequestId.current) {
        setBoardLoading(false);
      }
    }
  }, []);

  const handleSprintChange = (sprintId: string) => {
    setSelectedSprintId(sprintId);
    setTaskForm((prev) => ({ ...prev, sprintId }));
    if (projectId) {
      void loadBoardPreview(projectId, sprintId);
    }
  };

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
        const [projectResponse, sprintResponse, projectMemberResponse] =
          await Promise.all([
            projectsService.getProjectById(projectId),
            sprintsService.listSprints(),
            projectsService.listProjectMembers(projectId),
          ]);

        setProject(projectResponse);
        setProjectMembers(projectMemberResponse);
        setSprints(sprintResponse);
        const activeSprint = sprintResponse.find((sprint) => sprint.isCurrent);
        const initialSprintId = activeSprint?.id ?? "";
        setSelectedSprintId(initialSprintId);
        setTaskForm((prev) => ({
          ...prev,
          projectId,
          sprintId: initialSprintId,
        }));
        await loadBoardPreview(projectId, initialSprintId);
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
  }, [projectId, loadBoardPreview]);

  const handleCreateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId) {
      setTaskError("Missing project id.");
      return;
    }

    setTaskError("");
    setTaskFormErrors({});

    try {
      await createTaskSchema.validate(taskForm, { abortEarly: false });
    } catch (err) {
      if (err instanceof ValidationError) {
        setTaskFormErrors(mapValidationErrors(err));
        return;
      }

      setTaskError("Invalid task form data.");
      return;
    }

    setTaskSubmitting(true);
    try {
      const taskSprintId = taskForm.sprintId;
      await projectsService.createTask({ ...taskForm, projectId });
      setSelectedSprintId(taskSprintId);
      await loadBoardPreview(projectId, taskSprintId);
      showToast("Task created successfully.");
      setModalOpen(false);
      setTaskForm({
        ...INITIAL_TASK_FORM,
        projectId,
        sprintId: taskSprintId,
      });
    } catch (err) {
      setTaskError(
        err instanceof Error ? err.message : "Failed to create task.",
      );
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleUpdateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!projectId || !editingTask) {
      setTaskError("Missing task to update.");
      return;
    }

    setTaskError("");
    setEditTaskFormErrors({});

    try {
      await updateTaskSchema.validate(editTaskForm, { abortEarly: false });
    } catch (err) {
      if (err instanceof ValidationError) {
        setEditTaskFormErrors(mapEditValidationErrors(err));
        return;
      }

      setTaskError("Invalid task form data.");
      return;
    }

    setEditTaskSubmitting(true);
    try {
      await projectsService.updateTask(editingTask.id, {
        title: editTaskForm.title,
        description: editTaskForm.description,
        status: editTaskForm.status,
        priority: editTaskForm.priority,
        assigneeUserId: editTaskForm.assigneeUserId,
        blockedNote: editTaskForm.blockedNote,
        planEstimate: editTaskForm.planEstimate,
        startDate: editTaskForm.startDate,
        dueDate: editTaskForm.dueDate,
      });
      await loadBoardPreview(projectId, selectedSprintId);
      showToast("Task updated successfully.");
      setEditModalOpen(false);
      setEditingTask(null);
      setEditTaskForm(INITIAL_EDIT_TASK_FORM);
    } catch (err) {
      setTaskError(
        err instanceof Error ? err.message : "Failed to update task.",
      );
    } finally {
      setEditTaskSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <ActionToast
        visible={toastVisible}
        message={toastMessage}
        onClose={() => setToastVisible(false)}
      />

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
              <>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${projectId}/members`)}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface font-semibold rounded-xl hover:bg-surface-container-highest transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">
                      group
                    </span>
                    <span className="text-sm">Manage Members</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate(`/projects/${projectId}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 primary-gradient text-on-primary font-semibold rounded-xl shadow-sm hover:scale-102 active:scale-98 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">
                    edit
                  </span>
                  <span className="text-sm">Edit Project</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTaskError("");
                    setTaskFormErrors({});
                    setTaskForm((prev) => ({
                      ...prev,
                      projectId,
                      sprintId: selectedSprintId,
                    }));
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface font-semibold rounded-xl hover:bg-surface-container-highest transition-all"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  <span className="text-sm">New Task</span>
                </button>
              </>
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
          <article className="rounded-2xl border border-slate-100/70 bg-surface-container-low p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-lg font-black text-on-surface editorial-tight">
                  Project Board
                </h4>
                {selectedSprint?.isCurrent && (
                  <p className="mt-1 text-sm font-bold text-primary">
                    Active sprint: {selectedSprint.sprintCode}
                  </p>
                )}
              </div>
              <FormSelect
                containerClassName="w-full max-w-sm"
                label="Sprint"
                options={[
                  { label: "Select a sprint", value: "" },
                  ...availableSprints.map((sprint) => ({
                    label: `${sprint.sprintCode} (${sprint.startDate} – ${sprint.endDate})${sprint.isCurrent ? " — ACTIVE" : ""}`,
                    value: sprint.id,
                    className: sprint.isCurrent ? "font-bold" : undefined,
                  })),
                ]}
                value={selectedSprintId}
                onChange={(event) => handleSprintChange(event.target.value)}
              />
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
              <TaskBoard
                key={`${selectedSprintId}-${boardRevision}`}
                initialTasks={boardTasks}
                onEditTask={openEditTaskModal}
              />
            )}

            {!boardLoading && !boardError && !boardTasks && (
              <p className="text-sm text-on-surface-variant">
                {selectedSprintId
                  ? "Board data is not available for this project yet."
                  : "There is no active sprint. Select a sprint to view its tasks."}
              </p>
            )}
          </article>
        </section>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-on-surface editorial-tight">
                Create New Task
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {taskError && (
              <div className="rounded-xl bg-error-container p-3 text-sm text-error mb-4">
                {taskError}
              </div>
            )}

            <form
              onSubmit={handleCreateTask}
              noValidate
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <TextInput
                containerClassName="md:col-span-2"
                label="Task title"
                value={taskForm.title}
                onChange={(event) =>
                  updateTaskField("title", event.target.value)
                }
                placeholder="Enter task title"
                error={taskFormErrors.title}
              />

              <FormTextArea
                containerClassName="md:col-span-2"
                label="Description"
                value={taskForm.description}
                onChange={(event) =>
                  updateTaskField("description", event.target.value)
                }
                placeholder="Task description"
                error={taskFormErrors.description}
              />

              <FormSelect
                label="Priority"
                options={TASK_PRIORITY_OPTIONS}
                value={taskForm.priority}
                onChange={(event) =>
                  updateTaskField("priority", event.target.value)
                }
                error={taskFormErrors.priority}
              />

              <FormSelect
                label="Assignee"
                options={[
                  { label: "Select assignee", value: "" },
                  ...projectMembers
                    .filter(
                      (member) =>
                        member.memberStatus.toLowerCase() === "active",
                    )
                    .map((member) => ({
                      label: `${member.displayName} (${member.email})`,
                      value: member.userId,
                    })),
                ]}
                value={taskForm.assigneeUserId}
                onChange={(event) =>
                  updateTaskField("assigneeUserId", event.target.value)
                }
                error={taskFormErrors.assigneeUserId}
              />

              <TextInput
                label="Plan estimate"
                value={taskForm.planEstimate}
                onChange={(event) =>
                  updateTaskField("planEstimate", event.target.value)
                }
                placeholder="e.g. 8"
                error={taskFormErrors.planEstimate}
              />

              <FormSelect
                containerClassName="md:col-span-2"
                label="Sprint"
                options={[
                  { label: "Select a sprint", value: "" },
                  ...availableSprints.map((sprint) => ({
                    label: `${sprint.sprintCode} (${sprint.startDate} – ${sprint.endDate})${sprint.isCurrent ? " — ACTIVE" : ""}`,
                    value: sprint.id,
                    className: sprint.isCurrent ? "font-bold" : undefined,
                  })),
                ]}
                value={taskForm.sprintId}
                onChange={(event) =>
                  updateTaskField("sprintId", event.target.value)
                }
                error={taskFormErrors.sprintId}
              />

              <div className="md:col-span-2 flex gap-3 mt-2">
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="px-5 py-3 primary-gradient text-on-primary rounded-xl font-bold shadow-lg hover:scale-102 active:scale-98 transition-all disabled:opacity-60"
                >
                  {taskSubmitting ? "Creating..." : "Create Task"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold border border-outline/20 hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-black text-on-surface editorial-tight">
                  Edit Task
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  {editingTask?.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingTask(null);
                }}
                className="p-2 rounded-lg hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {taskError && (
              <div className="rounded-xl bg-error-container p-3 text-sm text-error mb-4">
                {taskError}
              </div>
            )}

            <form
              onSubmit={handleUpdateTask}
              noValidate
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <TextInput
                containerClassName="md:col-span-2"
                label="Task title"
                value={editTaskForm.title}
                onChange={(event) =>
                  updateEditTaskField("title", event.target.value)
                }
                placeholder="Enter task title"
                error={editTaskFormErrors.title}
              />

              <FormTextArea
                containerClassName="md:col-span-2"
                label="Description"
                value={editTaskForm.description}
                onChange={(event) =>
                  updateEditTaskField("description", event.target.value)
                }
                placeholder="Task description"
                error={editTaskFormErrors.description}
              />

              <FormSelect
                label="Status"
                options={TASK_STATUS_OPTIONS}
                value={editTaskForm.status}
                onChange={(event) =>
                  updateEditTaskField("status", event.target.value)
                }
                error={editTaskFormErrors.status}
              />

              <FormSelect
                label="Priority"
                options={TASK_PRIORITY_OPTIONS}
                value={editTaskForm.priority}
                onChange={(event) =>
                  updateEditTaskField("priority", event.target.value)
                }
                error={editTaskFormErrors.priority}
              />

              <FormSelect
                containerClassName="md:col-span-2"
                label="Assignee"
                options={[
                  { label: "Select assignee", value: "" },
                  ...projectMembers.map((member) => ({
                    label: `${member.displayName} (${member.email})`,
                    value: member.userId,
                  })),
                ]}
                value={editTaskForm.assigneeUserId}
                onChange={(event) =>
                  updateEditTaskField("assigneeUserId", event.target.value)
                }
                error={editTaskFormErrors.assigneeUserId}
              />

              <TextInput
                label="Plan estimate"
                value={editTaskForm.planEstimate}
                onChange={(event) =>
                  updateEditTaskField("planEstimate", event.target.value)
                }
                placeholder="e.g. 8"
                error={editTaskFormErrors.planEstimate}
              />

              <TextInput
                type="date"
                label="Start date"
                value={editTaskForm.startDate}
                onChange={(event) =>
                  updateEditTaskField("startDate", event.target.value)
                }
                error={editTaskFormErrors.startDate}
              />

              <TextInput
                type="date"
                label="Due date"
                value={editTaskForm.dueDate}
                onChange={(event) =>
                  updateEditTaskField("dueDate", event.target.value)
                }
                error={editTaskFormErrors.dueDate}
              />

              <FormTextArea
                containerClassName="md:col-span-2"
                label="Blocked note"
                value={editTaskForm.blockedNote}
                onChange={(event) =>
                  updateEditTaskField("blockedNote", event.target.value)
                }
                placeholder="Add a blocker or leave blank"
                error={editTaskFormErrors.blockedNote}
              />

              <div className="md:col-span-2 flex gap-3 mt-2">
                <button
                  type="submit"
                  disabled={editTaskSubmitting}
                  className="px-5 py-3 primary-gradient text-on-primary rounded-xl font-bold shadow-lg hover:scale-102 active:scale-98 transition-all disabled:opacity-60"
                >
                  {editTaskSubmitting ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingTask(null);
                    setEditTaskForm(INITIAL_EDIT_TASK_FORM);
                    setEditTaskFormErrors({});
                  }}
                  className="px-5 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold border border-outline/20 hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
