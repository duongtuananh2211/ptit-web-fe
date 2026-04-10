import React, { useEffect, useState } from "react";
import TaskListItem from "../components/TaskListItem";
import {
  myTasksService,
  type MyTaskListItem,
} from "../services/myTasksService";
import { projectsService } from "../services/projectsService";

type EditTaskForm = {
  title: string;
  description: string;
  status: string;
  priority: string;
  blockedNote: string;
  startDate: string;
  dueDate: string;
};

const INITIAL_EDIT_TASK_FORM: EditTaskForm = {
  title: "",
  description: "",
  status: "Todo",
  priority: "Low",
  blockedNote: "",
  startDate: "",
  dueDate: "",
};

const MyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<MyTaskListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<MyTaskListItem | null>(null);
  const [editingTask, setEditingTask] = useState<MyTaskListItem | null>(null);
  const [editTaskForm, setEditTaskForm] = useState<EditTaskForm>(
    INITIAL_EDIT_TASK_FORM,
  );
  const [editTaskSubmitting, setEditTaskSubmitting] = useState(false);
  const [editTaskError, setEditTaskError] = useState<string | null>(null);
  const [markDoneSubmitting, setMarkDoneSubmitting] = useState(false);
  const [markDoneError, setMarkDoneError] = useState<string | null>(null);

  const buildEditTaskForm = (task: MyTaskListItem): EditTaskForm => ({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    blockedNote: task.blockedNote ?? "",
    startDate: task.startDate ?? "",
    dueDate: task.dueDate ?? "",
  });

  const refreshTodoTasks = async () => {
    const todoTasks = await myTasksService.getMyBoard();
    setTasks(todoTasks);
    return todoTasks;
  };

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const todoTasks = await refreshTodoTasks();
        if (isMounted) {
          setTasks(todoTasks);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load your tasks.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  const openEditTaskModal = (task: MyTaskListItem) => {
    setEditingTask(task);
    setEditTaskForm(buildEditTaskForm(task));
    setEditTaskError(null);
    setSelectedTask(null);
  };

  const handleMarkTaskDone = async () => {
    if (!selectedTask) {
      setMarkDoneError("Missing task to update.");
      return;
    }

    setMarkDoneSubmitting(true);
    setMarkDoneError(null);

    try {
      await projectsService.updateTask(selectedTask.id, {
        title: selectedTask.title,
        description: selectedTask.description,
        status: "Done",
        priority: selectedTask.priority,
        assigneeUserId: "",
        blockedNote: selectedTask.blockedNote ?? "",
        planEstimate: "",
        startDate: selectedTask.startDate ?? "",
        dueDate: selectedTask.dueDate ?? "",
      });

      await refreshTodoTasks();
      setSelectedTask(null);
    } catch (updateError) {
      setMarkDoneError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to mark task as done.",
      );
    } finally {
      setMarkDoneSubmitting(false);
    }
  };

  const handleUpdateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingTask) {
      setEditTaskError("Missing task to update.");
      return;
    }

    setEditTaskError(null);
    setEditTaskSubmitting(true);

    try {
      await projectsService.updateTask(editingTask.id, {
        title: editTaskForm.title,
        description: editTaskForm.description,
        status: editTaskForm.status,
        priority: editTaskForm.priority,
        assigneeUserId: "",
        blockedNote: editTaskForm.blockedNote,
        planEstimate: "",
        startDate: editTaskForm.startDate,
        dueDate: editTaskForm.dueDate,
      });

      const todoTasks = await refreshTodoTasks();

      const updatedTask =
        todoTasks.find((task) => task.id === editingTask.id) ?? null;
      setEditingTask(updatedTask);
      setSelectedTask(updatedTask);
      setEditingTask(null);
      setEditTaskForm(INITIAL_EDIT_TASK_FORM);
    } catch (updateError) {
      setEditTaskError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update task.",
      );
    } finally {
      setEditTaskSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-on-surface editorial-tight">
            My Assignments
          </h2>
          <p className="text-on-surface-variant mt-1">
            Track your active contributions and upcoming deadlines.
          </p>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-sm text-on-surface-variant">
          Loading your todo tasks...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-tertiary/20 bg-tertiary-container p-6 text-sm text-on-tertiary-container">
          {error}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-sm text-on-surface-variant">
          No todo tasks found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onShowDetails={setSelectedTask}
            />
          ))}
        </div>
      )}

      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">
                  Task Details
                </p>
                <h3 className="mt-2 text-2xl font-black text-on-surface editorial-tight">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-outline transition-colors hover:bg-surface-container-low hover:text-on-surface"
                aria-label="Close task details"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkTaskDone}
                  disabled={markDoneSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-[#28A745] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    task_alt
                  </span>
                  {markDoneSubmitting ? "Marking..." : "Mark as Done"}
                </button>
                <button
                  type="button"
                  onClick={() => openEditTaskModal(selectedTask)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    edit
                  </span>
                  Edit Task
                </button>
              </div>
            </div>

            {markDoneError && (
              <div className="mt-4 rounded-2xl border border-tertiary/20 bg-tertiary-container p-4 text-sm text-on-tertiary-container">
                {markDoneError}
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">
                  Priority
                </p>
                <p className="mt-2 text-base font-semibold text-on-surface">
                  {selectedTask.priority}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">
                  Status
                </p>
                <p className="mt-2 text-base font-semibold text-on-surface">
                  {selectedTask.status}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">
                  Project
                </p>
                <p className="mt-2 text-base font-semibold text-on-surface">
                  {selectedTask.contextLabel}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">
                  Due
                </p>
                <p className="mt-2 text-base font-semibold text-on-surface">
                  {selectedTask.completed || selectedTask.dueLabel}
                </p>
              </div>
            </div>

            {typeof selectedTask.progressPercent === "number" && (
              <div className="mt-4 rounded-2xl bg-surface-container-low p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">
                    Progress
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {selectedTask.progressPercent}%
                  </p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-surface-container-high overflow-hidden">
                  <div
                    className="h-full primary-gradient"
                    style={{ width: `${selectedTask.progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">
                  Description
                </p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  {selectedTask.description ||
                    "No description provided for this task."}
                </p>
              </div>

              {selectedTask.blockedNote && (
                <div className="rounded-2xl border border-tertiary/20 bg-tertiary-container p-4 text-on-tertiary-container">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                    Blocked Note
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    {selectedTask.blockedNote}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
          onClick={() => setEditingTask(null)}
        >
          <form
            className="w-full max-w-2xl rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleUpdateTask}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">
                  Edit Task
                </p>
                <h3 className="mt-2 text-2xl font-black text-on-surface editorial-tight">
                  {editingTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-outline transition-colors hover:bg-surface-container-low hover:text-on-surface"
                aria-label="Close edit task"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">
                  Title
                </span>
                <input
                  value={editTaskForm.title}
                  onChange={(event) =>
                    setEditTaskForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">
                  Description
                </span>
                <textarea
                  value={editTaskForm.description}
                  onChange={(event) =>
                    setEditTaskForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary"
                />
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">
                  Status
                </span>
                <select
                  value={editTaskForm.status}
                  onChange={(event) =>
                    setEditTaskForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary"
                >
                  <option value="Todo">To Do</option>
                  <option value="Working">Working</option>
                  <option value="Stuck">Stuck</option>
                  <option value="Done">Done</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">
                  Priority
                </span>
                <select
                  value={editTaskForm.priority}
                  onChange={(event) =>
                    setEditTaskForm((current) => ({
                      ...current,
                      priority: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">
                  Start Date
                </span>
                <input
                  type="date"
                  value={editTaskForm.startDate}
                  onChange={(event) =>
                    setEditTaskForm((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary"
                />
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">
                  Due Date
                </span>
                <input
                  type="date"
                  value={editTaskForm.dueDate}
                  onChange={(event) =>
                    setEditTaskForm((current) => ({
                      ...current,
                      dueDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">
                  Blocked Note
                </span>
                <textarea
                  value={editTaskForm.blockedNote}
                  onChange={(event) =>
                    setEditTaskForm((current) => ({
                      ...current,
                      blockedNote: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary"
                />
              </label>
            </div>

            {editTaskError && (
              <div className="mt-4 rounded-2xl border border-tertiary/20 bg-tertiary-container p-4 text-sm text-on-tertiary-container">
                {editTaskError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editTaskSubmitting}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editTaskSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MyTasks;

