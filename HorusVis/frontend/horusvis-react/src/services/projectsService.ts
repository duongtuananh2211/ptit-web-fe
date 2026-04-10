import { authService } from "./authService";

const API_BASE_URL = "http://localhost:5049";

interface RawProject {
  id?: string | number;
  projectId?: string | number;
  projectKey?: string;
  projectName?: string;
  name?: string;
  title?: string;
  code?: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  memberCount?: number;
  taskCount?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface ProjectsResponseShape {
  data?: RawProject[];
  items?: RawProject[];
}

export interface ProjectSummary {
  id: string;
  title: string;
  code: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  memberCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  projectKey: string;
  projectName: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface UpdateProjectRequest {
  projectName: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface AddProjectMemberRequest {
  userId: string;
  projectRole: string;
}

export interface ProjectMember {
  memberId: string;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  projectRole: string;
  memberStatus: string;
  joinedAt: string;
}

export interface BoardTaskItem {
  id: string;
  title: string;
  priority: string;
  description?: string;
  status?: string;
  progressPercent?: number;
  planEstimate?: number;
  blockedNote?: string;
  startDate?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  featureAreaId?: string;
  featureAreaCode?: string;
  featureAreaName?: string;
  featureAreaColorHex?: string;
  assigneeUserId?: string;
  assigneeDisplayName?: string;
  assigneeAvatarUrl?: string;
  assignee?: string;
  assignees?: string[];
  date?: string;
  due?: string;
  progress?: number;
  completed?: string;
  warning?: string;
}

export interface ProjectBoardTasks {
  todo: BoardTaskItem[];
  working: BoardTaskItem[];
  stuck: BoardTaskItem[];
  done: BoardTaskItem[];
}

export interface FeatureAreaOption {
  id: string;
  code: string;
  name: string;
}

export interface CreateTaskRequest {
  projectId: string;
  title: string;
  description: string;
  priority: string;
  featureAreaId?: string;
  planEstimate: string;
  startDate: string;
  dueDate: string;
}

export interface UpdateTaskRequest {
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeUserId: string;
  blockedNote: string;
  featureAreaId?: string;
  planEstimate: string;
  startDate: string;
  dueDate: string;
}

interface RawBoardTask {
  id?: string | number;
  Id?: string | number;
  title?: string;
  Title?: string;
  description?: string;
  Description?: string;
  priority?: string;
  Priority?: string;
  status?: string;
  Status?: string;
  progressPercent?: number;
  ProgressPercent?: number;
  planEstimate?: number;
  PlanEstimate?: number;
  blockedNote?: string;
  BlockedNote?: string;
  startDate?: string;
  StartDate?: string;
  dueDate?: string;
  DueDate?: string;
  createdAt?: string;
  CreatedAt?: string;
  updatedAt?: string;
  UpdatedAt?: string;
  featureAreaId?: string;
  FeatureAreaId?: string;
  featureAreaCode?: string;
  FeatureAreaCode?: string;
  featureAreaName?: string;
  FeatureAreaName?: string;
  featureAreaColorHex?: string;
  FeatureAreaColorHex?: string;
  assigneeUserId?: string;
  AssigneeUserId?: string;
  assigneeDisplayName?: string;
  AssigneeDisplayName?: string;
  assigneeAvatarUrl?: string;
  AssigneeAvatarUrl?: string;
}

interface RawFeatureArea {
  id?: string;
  areaCode?: string;
  areaName?: string;
  Id?: string;
  AreaCode?: string;
  AreaName?: string;
}

interface RawBoardColumn {
  status?: string;
  tasks?: RawBoardTask[];
  topTasks?: RawBoardTask[];
}

interface RawBoardPreview {
  columns?: RawBoardColumn[];
}

interface RawProjectMember {
  memberId?: string;
  userId?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  projectRole?: string;
  memberStatus?: string;
  joinedAt?: string;
  MemberId?: string;
  UserId?: string;
  DisplayName?: string;
  Email?: string;
  AvatarUrl?: string;
  ProjectRole?: string;
  MemberStatus?: string;
  JoinedAt?: string;
}

const DEFAULT_AVATAR_URL =
  "https://ui-avatars.com/api/?background=E8EEFF&color=1F2A44&size=64&name=HV";

const formatBoardDate = (value?: string): string => {
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
  const headers: HeadersInit = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const getErrorMessage = async (response: Response, fallback: string) => {
  const error = await response.json().catch(() => ({}));
  return error.value?.detail || error.detail || error.message || fallback;
};

const normalizeProject = (raw: RawProject, index: number): ProjectSummary => {
  const idValue = raw.id ?? raw.projectId ?? index;

  const title =
    typeof raw.title === "string" && raw.title.trim().length > 0
      ? raw.title
      : typeof raw.projectName === "string" && raw.projectName.trim().length > 0
        ? raw.projectName
        : typeof raw.name === "string" && raw.name.trim().length > 0
          ? raw.name
          : `Project ${index + 1}`;

  const code =
    typeof raw.code === "string" && raw.code.trim().length > 0
      ? raw.code
      : typeof raw.projectKey === "string" && raw.projectKey.trim().length > 0
        ? raw.projectKey
        : "";

  return {
    id: String(idValue),
    title,
    code,
    description: typeof raw.description === "string" ? raw.description : "",
    status: typeof raw.status === "string" ? raw.status : "active",
    startDate: typeof raw.startDate === "string" ? raw.startDate : "",
    endDate: typeof raw.endDate === "string" ? raw.endDate : "",
    memberCount: typeof raw.memberCount === "number" ? raw.memberCount : 0,
    taskCount: typeof raw.taskCount === "number" ? raw.taskCount : 0,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "",
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
  };
};

const parseProjectList = (payload: unknown): RawProject[] => {
  if (Array.isArray(payload)) {
    return payload as RawProject[];
  }

  if (payload && typeof payload === "object") {
    const asObject = payload as ProjectsResponseShape;
    if (Array.isArray(asObject.data)) {
      return asObject.data;
    }
    if (Array.isArray(asObject.items)) {
      return asObject.items;
    }
  }

  return [];
};

const mapStatusToKey = (status: string): keyof ProjectBoardTasks | null => {
  const normalized = status.trim().toLowerCase();

  if (normalized === "todo" || normalized === "to do") {
    return "todo";
  }

  if (normalized === "working" || normalized === "in progress") {
    return "working";
  }

  if (normalized === "stuck" || normalized === "blocked") {
    return "stuck";
  }

  if (normalized === "done") {
    return "done";
  }

  return null;
};

const createEmptyBoard = (): ProjectBoardTasks => ({
  todo: [],
  working: [],
  stuck: [],
  done: [],
});

const normalizeBoardTask = (
  task: RawBoardTask,
  index: number,
): BoardTaskItem => {
  const idValue = task.id ?? task.Id ?? `task-${index + 1}`;
  const priority =
    typeof task.priority === "string" && task.priority.trim().length > 0
      ? task.priority
      : typeof task.Priority === "string" && task.Priority.trim().length > 0
        ? task.Priority
        : "Medium";
  const description = task.description ?? task.Description;
  const status = task.status ?? task.Status;
  const progressPercent = task.progressPercent ?? task.ProgressPercent;
  const planEstimate = task.planEstimate ?? task.PlanEstimate;
  const blockedNote = task.blockedNote ?? task.BlockedNote;
  const startDate = task.startDate ?? task.StartDate;
  const dueDate = task.dueDate ?? task.DueDate;
  const createdAt = task.createdAt ?? task.CreatedAt;
  const updatedAt = task.updatedAt ?? task.UpdatedAt;
  const featureAreaId = task.featureAreaId ?? task.FeatureAreaId;
  const featureAreaCode = task.featureAreaCode ?? task.FeatureAreaCode;
  const featureAreaName = task.featureAreaName ?? task.FeatureAreaName;
  const featureAreaColorHex =
    task.featureAreaColorHex ?? task.FeatureAreaColorHex;
  const assigneeUserId = task.assigneeUserId ?? task.AssigneeUserId;
  const assigneeDisplayName =
    task.assigneeDisplayName ?? task.AssigneeDisplayName;
  const assigneeAvatarUrl = task.assigneeAvatarUrl ?? task.AssigneeAvatarUrl;

  return {
    id: String(idValue),
    title:
      typeof task.title === "string" && task.title.trim().length > 0
        ? task.title
        : typeof task.Title === "string" && task.Title.trim().length > 0
          ? task.Title
          : `Task ${index + 1}`,
    priority,
    description: typeof description === "string" ? description : "",
    status: typeof status === "string" ? status : "",
    progressPercent:
      typeof progressPercent === "number" ? progressPercent : undefined,
    planEstimate: typeof planEstimate === "number" ? planEstimate : undefined,
    blockedNote: typeof blockedNote === "string" ? blockedNote : "",
    startDate: typeof startDate === "string" ? startDate : "",
    dueDate: typeof dueDate === "string" ? dueDate : "",
    createdAt: typeof createdAt === "string" ? createdAt : "",
    updatedAt: typeof updatedAt === "string" ? updatedAt : "",
    featureAreaId: typeof featureAreaId === "string" ? featureAreaId : "",
    featureAreaCode: typeof featureAreaCode === "string" ? featureAreaCode : "",
    featureAreaName: typeof featureAreaName === "string" ? featureAreaName : "",
    featureAreaColorHex:
      typeof featureAreaColorHex === "string" ? featureAreaColorHex : "",
    assigneeUserId: typeof assigneeUserId === "string" ? assigneeUserId : "",
    assigneeDisplayName:
      typeof assigneeDisplayName === "string" ? assigneeDisplayName : "",
    assigneeAvatarUrl:
      typeof assigneeAvatarUrl === "string" &&
      assigneeAvatarUrl.trim().length > 0
        ? assigneeAvatarUrl
        : DEFAULT_AVATAR_URL,
    assignee:
      typeof assigneeAvatarUrl === "string" &&
      assigneeAvatarUrl.trim().length > 0
        ? assigneeAvatarUrl
        : DEFAULT_AVATAR_URL,
    assignees: assigneeAvatarUrl ? [assigneeAvatarUrl] : [DEFAULT_AVATAR_URL],
    date:
      formatBoardDate(startDate) ||
      formatBoardDate(createdAt) ||
      "From Board Preview",
    due: formatBoardDate(dueDate),
    warning:
      typeof blockedNote === "string" && blockedNote.trim().length > 0
        ? blockedNote
        : undefined,
  };
};

const parseBoardPreview = (payload: unknown): ProjectBoardTasks => {
  const board = createEmptyBoard();

  if (!payload || typeof payload !== "object") {
    return board;
  }

  const maybeBoard = payload as RawBoardPreview;
  const columns = Array.isArray(maybeBoard.columns) ? maybeBoard.columns : [];

  columns.forEach((column) => {
    const statusKey = mapStatusToKey(
      typeof column.status === "string" ? column.status : "",
    );
    if (!statusKey) {
      return;
    }

    const rawTasks = Array.isArray(column.tasks)
      ? column.tasks
      : Array.isArray(column.topTasks)
        ? column.topTasks
        : [];

    board[statusKey] = rawTasks.map(normalizeBoardTask);
  });

  return board;
};

const normalizeProjectMember = (
  raw: RawProjectMember,
  index: number,
): ProjectMember => {
  const memberId = raw.memberId ?? raw.MemberId ?? `${index + 1}`;
  const userId = raw.userId ?? raw.UserId ?? "";

  return {
    memberId,
    userId,
    displayName: raw.displayName ?? raw.DisplayName ?? "Unknown User",
    email: raw.email ?? raw.Email ?? "",
    avatarUrl: raw.avatarUrl ?? raw.AvatarUrl ?? DEFAULT_AVATAR_URL,
    projectRole: raw.projectRole ?? raw.ProjectRole ?? "Member",
    memberStatus: raw.memberStatus ?? raw.MemberStatus ?? "Active",
    joinedAt: raw.joinedAt ?? raw.JoinedAt ?? "",
  };
};

const normalizeDateOnly = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeFeatureArea = (
  area: RawFeatureArea,
  index: number,
): FeatureAreaOption => {
  const id = area.id ?? area.Id ?? `${index + 1}`;

  return {
    id,
    code: area.areaCode ?? area.AreaCode ?? "",
    name: area.areaName ?? area.AreaName ?? `Area ${index + 1}`,
  };
};

export const projectsService = {
  async listProjects(): Promise<ProjectSummary[]> {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `List projects failed with status ${response.status}`,
        ),
      );
    }

    const payload = (await response.json().catch(() => [])) as unknown;
    return parseProjectList(payload).map(normalizeProject);
  },

  async getProjectById(projectId: string): Promise<ProjectSummary> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `Get project failed with status ${response.status}`,
        ),
      );
    }

    const payload = (await response.json().catch(() => ({}))) as RawProject;
    return normalizeProject(payload, 0);
  },

  async getProjectBoardPreview(projectId: string): Promise<ProjectBoardTasks> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/board-preview`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `Get project board preview failed with status ${response.status}`,
        ),
      );
    }

    const payload = (await response.json().catch(() => ({}))) as unknown;
    return parseBoardPreview(payload);
  },

  async listFeatureAreas(projectId: string): Promise<FeatureAreaOption[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/tasks/feature-areas/${encodeURIComponent(projectId)}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `List feature areas failed with status ${response.status}`,
        ),
      );
    }

    const payload = (await response.json().catch(() => [])) as unknown;
    if (!Array.isArray(payload)) {
      return [];
    }

    return (payload as RawFeatureArea[]).map(normalizeFeatureArea);
  },

  async createTask(data: CreateTaskRequest): Promise<void> {
    const parsedPlanEstimate = data.planEstimate.trim();

    const payload = {
      projectId: data.projectId,
      title: data.title.trim(),
      description: data.description.trim() || null,
      priority: data.priority,
      featureAreaId: data.featureAreaId || null,
      planEstimate:
        parsedPlanEstimate.length > 0 ? Number(parsedPlanEstimate) : null,
      startDate: normalizeDateOnly(data.startDate),
      dueDate: normalizeDateOnly(data.dueDate),
    };

    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `Create task failed with status ${response.status}`,
        ),
      );
    }
  },

  async updateTask(taskId: string, data: UpdateTaskRequest): Promise<void> {
    const parsedPlanEstimate = data.planEstimate.trim();

    const payload = {
      title: data.title.trim(),
      description: data.description.trim() || null,
      status: data.status,
      priority: data.priority,
      assigneeUserId: data.assigneeUserId || null,
      blockedNote: data.blockedNote.trim() || null,
      featureAreaId: data.featureAreaId || null,
      planEstimate:
        parsedPlanEstimate.length > 0 ? Number(parsedPlanEstimate) : null,
      startDate: normalizeDateOnly(data.startDate),
      dueDate: normalizeDateOnly(data.dueDate),
    };

    const response = await fetch(
      `${API_BASE_URL}/api/tasks/${encodeURIComponent(taskId)}`,
      {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `Update task failed with status ${response.status}`,
        ),
      );
    }
  },

  async createProject(data: CreateProjectRequest): Promise<ProjectSummary> {
    const payload = {
      projectKey: data.projectKey.trim(),
      projectName: data.projectName.trim(),
      description: data.description.trim() || null,
      startDate: normalizeDateOnly(data.startDate),
      endDate: normalizeDateOnly(data.endDate),
    };

    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `Create project failed with status ${response.status}`,
        ),
      );
    }

    const created = (await response.json().catch(() => ({}))) as RawProject;
    return normalizeProject(created, 0);
  },

  async updateProject(
    projectId: string,
    data: UpdateProjectRequest,
  ): Promise<ProjectSummary> {
    const payload = {
      projectName: data.projectName.trim(),
      description: data.description.trim() || null,
      status: data.status,
      startDate: normalizeDateOnly(data.startDate),
      endDate: normalizeDateOnly(data.endDate),
    };

    const response = await fetch(
      `${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}`,
      {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `Update project failed with status ${response.status}`,
        ),
      );
    }

    const updated = (await response.json().catch(() => ({}))) as RawProject;
    return normalizeProject(updated, 0);
  },

  async listProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/members`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `List project members failed with status ${response.status}`,
        ),
      );
    }

    const payload = (await response.json().catch(() => [])) as unknown;
    if (!Array.isArray(payload)) {
      return [];
    }

    return (payload as RawProjectMember[]).map(normalizeProjectMember);
  },

  async addProjectMember(
    projectId: string,
    data: AddProjectMemberRequest,
  ): Promise<ProjectMember> {
    const payload = {
      userId: data.userId,
      projectRole: data.projectRole.trim(),
    };

    const response = await fetch(
      `${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/members`,
      {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `Add project member failed with status ${response.status}`,
        ),
      );
    }

    const payloadResult = (await response
      .json()
      .catch(() => ({}))) as RawProjectMember;
    return normalizeProjectMember(payloadResult, 0);
  },

  async removeProjectMember(
    projectId: string,
    memberId: string,
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(memberId)}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `Remove project member failed with status ${response.status}`,
        ),
      );
    }
  },
};

