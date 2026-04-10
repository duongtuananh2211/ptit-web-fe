import { authService } from "./authService";

const API_BASE_URL = "http://localhost:5049";

interface RawFeatureArea {
  areaName?: string;
  AreaName?: string;
}

interface RawTaskResponse {
  id?: string | number;
  Id?: string | number;
  title?: string;
  Title?: string;
  description?: string | null;
  Description?: string | null;
  priority?: string;
  Priority?: string;
  blockedNote?: string | null;
  BlockedNote?: string | null;
  progressPercent?: number | null;
  ProgressPercent?: number | null;
  planEstimate?: number | null;
  PlanEstimate?: number | null;
  startDate?: string | null;
  StartDate?: string | null;
  dueDate?: string | null;
  DueDate?: string | null;
  status?: string;
  Status?: string;
  featureArea?: RawFeatureArea | null;
  FeatureArea?: RawFeatureArea | null;
}

interface RawMyBoardResponse {
  todoTasks?: RawTaskResponse[];
  TodoTasks?: RawTaskResponse[];
}

export interface MyTaskListItem {
  id: string;
  title: string;
  priority: string;
  description: string;
  progressPercent?: number;
  blockedNote?: string;
  status: string;
  contextLabel: string;
  dueLabel: string;
  startDate?: string;
  dueDate?: string;
  completed?: string;
}

const formatTaskDate = (value?: string | null): string => {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(parsedDate);
};

const getAuthHeaders = (): HeadersInit => {
  const token = authService.getToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const getErrorMessage = async (response: Response, fallback: string) => {
  const error = await response.json().catch(() => ({}));
  return error.value?.detail || error.detail || error.message || fallback;
};

const normalizeTask = (task: RawTaskResponse): MyTaskListItem => {
  const featureArea = task.featureArea ?? task.FeatureArea ?? null;

  return {
    id: String(task.id ?? task.Id ?? ""),
    title: task.title ?? task.Title ?? "Untitled task",
    priority: task.priority ?? task.Priority ?? "Low",
    description: task.description ?? task.Description ?? "",
    progressPercent: task.progressPercent ?? task.ProgressPercent ?? undefined,
    blockedNote: task.blockedNote ?? task.BlockedNote ?? undefined,
    status: task.status ?? task.Status ?? "Todo",
    contextLabel: featureArea?.areaName ?? featureArea?.AreaName ?? "Todo task",
    dueLabel:
      formatTaskDate(
        task.dueDate ?? task.DueDate ?? task.startDate ?? task.StartDate,
      ) || "No due date",
    startDate: task.startDate ?? task.StartDate ?? undefined,
    dueDate: task.dueDate ?? task.DueDate ?? undefined,
    completed: undefined,
  };
};

const parseTodoTasks = (payload: unknown): RawTaskResponse[] => {
  if (payload && typeof payload === "object") {
    const response = payload as RawMyBoardResponse;
    if (Array.isArray(response.todoTasks)) {
      return response.todoTasks;
    }

    if (Array.isArray(response.TodoTasks)) {
      return response.TodoTasks;
    }
  }

  return [];
};

export const myTasksService = {
  async getMyBoard(): Promise<MyTaskListItem[]> {
    const response = await fetch(`${API_BASE_URL}/api/my-tasks/board`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `Failed to load my tasks board with status ${response.status}`,
        ),
      );
    }

    const payload = await response.json().catch(() => ({}));
    return parseTodoTasks(payload).map(normalizeTask);
  },
};

