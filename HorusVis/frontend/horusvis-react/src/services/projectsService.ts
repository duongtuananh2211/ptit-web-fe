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
  assignee: string;
  date: string;
}

export interface ProjectBoardTasks {
  todo: BoardTaskItem[];
  working: BoardTaskItem[];
  stuck: BoardTaskItem[];
  done: BoardTaskItem[];
}

interface RawBoardTask {
  id?: string | number;
  title?: string;
  priority?: string;
  assigneeUserId?: string;
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
  const idValue = task.id ?? `task-${index + 1}`;
  const priority =
    typeof task.priority === "string" && task.priority.trim().length > 0
      ? task.priority
      : "Medium";

  return {
    id: String(idValue),
    title:
      typeof task.title === "string" && task.title.trim().length > 0
        ? task.title
        : `Task ${index + 1}`,
    priority,
    assignee: DEFAULT_AVATAR_URL,
    date: "From Board Preview",
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

