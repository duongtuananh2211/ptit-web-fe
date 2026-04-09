import {
  AdminClient,
  AdminMetricsClient,
  AdminRolesClient,
  AdminSessionsClient,
  AdminUsersClient,
  AuthClient,
  DeploymentsClient,
  MyTasksClient,
  ProjectsClient,
  ReportsClient,
  SprintsClient,
} from '@horusvis-web/Reference';
import { Authenticator } from './lib/authenticator';
import { TeamMember, Board, Task, Column, Comment, CurrentUser } from './types';
import { versionDetection } from './utils/versionDetection';
import { handleAuthError } from './utils/authErrorHandler';

// ─── JWT decoder ─────────────────────────────────────────────────────────────
/** Decode a JWT payload without verifying the signature. */
function decodeJwtPayload(token: string): Record<string, any> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

/** Build a CurrentUser from a decoded JWT payload (matches .NET ClaimTypes mapping). */
function userFromJwt(token: string): CurrentUser {
  const p = decodeJwtPayload(token);
  // .NET JwtSecurityTokenHandler maps ClaimTypes.* to short form:
  //   NameIdentifier → nameid, Name → unique_name, Email → email, Role → role
  const id: string = p['nameid'] ?? p['sub'] ?? '';
  const name: string = p['unique_name'] ?? p['name'] ?? '';
  const email: string = p['email'] ?? '';
  const rawRole = p['role'];
  const roles: string[] = rawRole
    ? Array.isArray(rawRole) ? rawRole : [rawRole]
    : [];

  // Split "First Last" into parts; fall back gracefully
  const [firstName = name, lastName = ''] = name.includes(' ')
    ? [name.substring(0, name.indexOf(' ')), name.substring(name.indexOf(' ') + 1)]
    : [name, ''];

  return { id, email, firstName, lastName, roles };
}

// ─── Backend base URL ──────────────────────────────────────────────────────
// Call the backend directly to avoid Vite proxy 307 redirects.
// Override with VITE_BACKEND_URL env var (e.g. in .env.local).
const BACKEND_BASE: string =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'https://localhost:7235';

// ─── Token management ────────────────────────────────────────────────────────
let isRedirecting = false;
let hasInvalidToken = false;
let hadTokenBefore = false;

const handleInvalidToken = () => {
  if (isRedirecting) return;
  isRedirecting = true;
  hasInvalidToken = true;
  localStorage.removeItem('authToken');
  sessionStorage.setItem('tokenExpiredRedirect', 'true');
  window.location.hash = '#kanban';
  setTimeout(() => window.location.reload(), 100);
};

// ─── NSwag client instances ──────────────────────────────────────────────────
// Authenticator injects Bearer token on every request
export const authenticator = new Authenticator(() => localStorage.getItem('authToken') ?? '');
authenticator.addEventListener('tokenExpired', () => handleInvalidToken());
authenticator.addEventListener('authError', () => handleInvalidToken());

export const authNswagClient    = new AuthClient(BACKEND_BASE,            { fetch: window.fetch.bind(window) });
export const adminClient        = new AdminClient(BACKEND_BASE,           authenticator);
export const adminMetricsClient = new AdminMetricsClient(BACKEND_BASE,    authenticator);
export const adminRolesClient   = new AdminRolesClient(BACKEND_BASE,      authenticator);
export const adminSessionsClient= new AdminSessionsClient(BACKEND_BASE,   authenticator);
export const adminUsersClient   = new AdminUsersClient(BACKEND_BASE,      authenticator);
export const projectsClient     = new ProjectsClient(BACKEND_BASE,        authenticator);
export const reportsClient      = new ReportsClient(BACKEND_BASE,         authenticator);
export const sprintsClient      = new SprintsClient(BACKEND_BASE,         authenticator);
export const myTasksClient      = new MyTasksClient(BACKEND_BASE,         authenticator);
export const deploymentsClient  = new DeploymentsClient(BACKEND_BASE,     authenticator);

// ─── Low-level fetch helpers ─────────────────────────────────────────────────
const PUBLIC_PATHS = [
  '/auth/login', '/auth/register', '/auth/activate-account',
  '/auth/forgot-password', '/auth/reset-password',
  '/auth/check-default-admin', '/auth/check-demo-user',
  '/auth/instance-status', '/auth/is-owner',
  '/auth/google', '/password-reset',
  '/settings', '/health', '/ready', '/admin-portal/license-info',
];

/** Fetch against /api, adds Authorization header for protected routes. */
async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (isRedirecting || hasInvalidToken) {
    throw new Error('Invalid token - redirecting to login');
  }

  const token = localStorage.getItem('authToken');
  const isPublic = PUBLIC_PATHS.some(p => path.startsWith(p));

  if (!token && !isPublic) {
    console.warn(`⚠️ No token for ${path}`);
    throw new Error('No auth token available');
  }

  hadTokenBefore = hadTokenBefore || !!token;

  const headers: Record<string, string> = {
    ...(!(init.body instanceof FormData) && { 'Content-Type': 'application/json' }),
    ...(init.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${BACKEND_BASE}/api${path}`, { ...init, headers });

  const appVersion = response.headers.get('x-app-version');
  if (appVersion) versionDetection.checkVersion(appVersion);

  if (response.status === 401 && !isRedirecting) {
    const currentToken = localStorage.getItem('authToken');
    if ((hadTokenBefore || currentToken) && currentToken) {
      handleInvalidToken();
    }
    const body = await response.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || 'Unauthorized'), { response: { status: 401, data: body } });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || 'Request failed'), { response: { status: response.status, data: body } });
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ─── axios-compatible default export ─────────────────────────────────────────
// Used by components that do api.get(), api.post(), etc.
const api = {
  get: <T = any>(path: string, config?: { params?: Record<string, any>; signal?: AbortSignal; data?: any }) => {
    let url = path;
    if (config?.params) {
      const q = new URLSearchParams(
        Object.fromEntries(
          Object.entries(config.params)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)])
        )
      ).toString();
      if (q) url = `${url}?${q}`;
    }
    return apiFetch<T>(url, { method: 'GET', signal: config?.signal }).then(data => ({ data }));
  },
  post: <T = any>(path: string, body?: any, config?: RequestInit) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...config,
    }).then(data => ({ data })),
  put: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }).then(data => ({ data })),
  delete: <T = any>(path: string, config?: { data?: any; signal?: AbortSignal }) =>
    apiFetch<T>(path, {
      method: 'DELETE',
      signal: config?.signal,
      ...(config?.data ? { body: JSON.stringify(config.data) } : {}),
    }).then(data => ({ data })),
  patch: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }).then(data => ({ data })),
};

// Members
export const getMembers = async (includeSystem?: boolean) => {
  const params = includeSystem ? { includeSystem: 'true' } : {};
  const { data } = await api.get<TeamMember[]>('/members', { params });
  return data;
};

export const createMember = async (member: TeamMember) => {
  const { data } = await api.post<TeamMember>('/members', member);
  return data;
};

export const deleteMember = async (id: string) => {
  const { data } = await api.delete(`/members/${id}`);
  return data;
};

// Boards
export const getBoards = async () => {
  const { data } = await api.get<Board[]>('/boards');
  return data;
};

// Get columns for a specific board
export const getBoardColumns = async (boardId: string) => {
  const { data } = await api.get<{id: string, title: string, boardId: string, position: number}[]>(`/boards/${boardId}/columns`);
  return data;
};

export const createBoard = async (board: Board) => {
  const { data } = await api.post<Board>('/boards', board);
  return data;
};

export const updateBoard = async (id: string, title: string) => {
  const { data } = await api.put<Board>(`/boards/${id}`, { title });
  return data;
};

export const deleteBoard = async (id: string) => {
  const { data } = await api.delete(`/boards/${id}`);
  return data;
};

export const reorderBoards = async (boardId: string, newPosition: number) => {
  const { data } = await api.post('/boards/reorder', { boardId, newPosition });
  return data;
};

// Columns
export const createColumn = async (column: Column) => {
  const { data } = await api.post<Column>('/columns', column);
  return data;
};

export const updateColumn = async (id: string, title: string, is_finished?: boolean, is_archived?: boolean) => {
  const { data } = await api.put<Column>(`/columns/${id}`, { title, is_finished, is_archived });
  return data;
};

export const deleteColumn = async (id: string) => {
  const { data } = await api.delete(`/columns/${id}`);
  return data;
};

export const reorderColumns = async (columnId: string, newPosition: number, boardId: string) => {
  const { data } = await api.post('/columns/reorder', { columnId, newPosition, boardId });
  return data;
};

export const renumberColumns = async (boardId: string) => {
  const { data } = await api.post('/columns/renumber', { boardId });
  return data;
};

// Move task to different board
export const moveTaskToBoard = async (taskId: string, targetBoardId: string) => {
  const { data } = await api.post('/tasks/move-to-board', { taskId, targetBoardId });
  return data;
};

export const reorderTasks = async (taskId: string, newPosition: number, columnId: string) => {
  const { data } = await api.post('/tasks/reorder', { taskId, newPosition, columnId });
  return data;
};

export const createTaskAtTop = async (task: Task) => {
  const { data } = await api.post<Task>('/tasks/add-at-top', task);
  return data;
};

// Tasks
export const getTaskById = async (id: string) => {
  const { data } = await api.get<Task>(`/tasks/${id}`);
  return data;
};

export const createTask = async (task: Task) => {
  const { data } = await api.post<Task>('/tasks', task);
  return data;
};

export const updateTask = async (task: Task) => {
  // console.log('📡 [API] updateTask called with:', {
  //   taskId: task.id,
  //   title: task.title,
  //   startDate: task.startDate,
  //   dueDate: task.dueDate,
  //   isSingleDay: task.startDate === task.dueDate
  // });
  
  const { data } = await api.put<Task>(`/tasks/${task.id}`, task);
  
  // console.log('📡 [API] updateTask response:', {
  //   taskId: data.id,
  //   startDate: data.startDate,
  //   dueDate: data.dueDate
  // });
  
  return data;
};

export const batchUpdateTasks = async (tasks: Task[]) => {
  const { data } = await api.post<{ tasks: Task[]; updated: number }>('/tasks/batch-update', { tasks });
  return data.tasks;
};

export const deleteTask = async (id: string) => {
  const { data } = await api.delete(`/tasks/${id}`);
  return data;
};

// Batch update task positions (optimized for drag-and-drop)
export const batchUpdateTaskPositions = async (updates: Array<{ taskId: string; position: number; columnId?: string }>) => {
  const { data } = await api.post('/tasks/batch-update-positions', { updates });
  return data;
};

// Comments
export const createComment = async (comment: Comment & { 
  taskId: string; 
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }> 
}) => {
  const { data } = await api.post<Comment>('/comments', comment);
  return data;
};

export const updateComment = async (id: string, text: string) => {
  const { data } = await api.put(`/comments/${id}`, { text });
  return data;
};

export const deleteComment = async (id: string) => {
  const { data } = await api.delete(`/comments/${id}`);
  return data;
};

// Authentication
// HorusVis backend returns { accessToken, expiresAt } — no user object in the response.
// We decode the JWT claims to build the user, then return { user, token } to match
// what Login.tsx / useAuth.ts expects.
export const login = async (email: string, password: string): Promise<{ user: CurrentUser; token: string }> => {
  const response = await fetch(`${BACKEND_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: email, password }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || body.detail || 'Login failed'), { response: { data: body } });
  }
  const { accessToken } = await response.json();
  return { user: userFromJwt(accessToken), token: accessToken };
};

export const register = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}) => {
  const { data } = await api.post('/auth/register', userData);
  return data;
};

export const getCurrentUser = (): { user: CurrentUser } => {
  // HorusVis backend has no /auth/me endpoint — decode claims from the stored JWT.
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No auth token available');
  return { user: userFromJwt(token) };
};

export const updateAppUrl = async (appUrl: string) => {
  const { data } = await api.put('/settings/app-url', { appUrl });
  return data;
};

// Debug - DISABLED
// export const getQueryLogs = async () => {
//   const { data } = await api.get('/debug/logs');
//   return data;
// };

// Add a new function to handle file uploads
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  // Don't set Content-Type manually - browser will set it with boundary for FormData
  const { data } = await api.post<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>('/upload', formData);
  return data;
};

export const fetchCommentAttachments = async (commentId: string) => {
  // Don't make API calls if no token is available
  if (!localStorage.getItem('authToken')) {
    // If user was previously authenticated, this is an auth error
    handleAuthError('Missing auth token for fetchCommentAttachments');
    return [];
  }
  
  const { data } = await api.get(`/comments/${commentId}/attachments`);
  return data;
};

// Task Attachments API
export const fetchTaskAttachments = async (taskId: string) => {
  // Don't make API calls if no token is available
  if (!localStorage.getItem('authToken')) {
    // If user was previously authenticated, this is an auth error
    handleAuthError('Missing auth token for fetchTaskAttachments');
    return [];
  }
  
  const { data } = await api.get(`/tasks/${taskId}/attachments`);
  return data;
};

export const addTaskAttachments = async (taskId: string, attachments: Array<{
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}>) => {
  const { data } = await api.post(`/tasks/${taskId}/attachments`, { attachments });
  return data;
};

export const deleteAttachment = async (attachmentId: string) => {
  const { data } = await api.delete(`/attachments/${attachmentId}`);
  return data;
};

// Admin API
export const getUsers = async () => {
  const { data } = await api.get('/admin/users');
  return data;
};

export const createUser = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  role: string;
  isActive?: boolean;
}) => {
  const { data } = await api.post('/admin/users', {
    ...userData,
    baseUrl: window.location.origin // Send the current browser origin
  });
  return data;
};

export const updateUser = async (userId: string, userData: {
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  displayName?: string; // Optional since it's handled separately
}) => {
  try {
    // Only send fields that the backend endpoint expects
    const { firstName, lastName, email, isActive } = userData;
    const { data } = await api.put(`/admin/users/${userId}`, { 
      firstName, 
      lastName, 
      email, 
      isActive 
    });
    return data;
  } catch (error: any) {
    // Re-throw the error so it can be caught by the calling function
    throw error;
  }
};

export const updateUserRole = async (userId: string, action: 'promote' | 'demote') => {
  const { data } = await api.put(`/admin/users/${userId}/role`, { action });
  return data;
};

export const deleteUser = async (userId: string) => {
  const { data } = await api.delete(`/admin/users/${userId}`);
  return data;
};

export const resendUserInvitation = async (userId: string) => {
  const { data } = await api.post(`/admin/users/${userId}/resend-invitation`, {
    baseUrl: window.location.origin // Send the current browser origin
  });
  return data;
};


export const getUserTaskCount = async (userId: string) => {
  const { data } = await api.get(`/admin/users/${userId}/task-count`);
  return data;
};

export const updateMemberColor = async (userId: string, color: string) => {
  const { data } = await api.put(`/admin/users/${userId}/color`, { color });
  return data;
};

// Self-service account deletion
export const deleteAccount = async () => {
  const { data } = await api.delete('/users/account');
  return data;
};

// Admin Settings with caching to prevent duplicate calls
let lastAdminSettingsCall = 0;
let cachedAdminSettings: any = null;
const ADMIN_SETTINGS_CACHE_MS = 500; // Cache for 500ms to prevent duplicate calls

export const getSettings = async () => {
  const now = Date.now();
  
  // If we called this very recently, return cached data
  if (cachedAdminSettings && (now - lastAdminSettingsCall) < ADMIN_SETTINGS_CACHE_MS) {
    return cachedAdminSettings;
  }
  
  lastAdminSettingsCall = now;
  const { data } = await api.get('/admin/settings');
  cachedAdminSettings = data;
  return data;
};

// Public Settings with caching to prevent duplicate calls
let lastPublicSettingsCall = 0;
let cachedPublicSettings: any = null;
let pendingPublicSettingsPromise: Promise<any> | null = null;
const PUBLIC_SETTINGS_CACHE_MS = 2000; // Cache for 2 seconds to prevent duplicate calls

export const getPublicSettings = async () => {
  const now = Date.now();
  
  // If we called this very recently, return cached data
  if (cachedPublicSettings && (now - lastPublicSettingsCall) < PUBLIC_SETTINGS_CACHE_MS) {
    return cachedPublicSettings;
  }
  
  // If a request is already in flight, return the same promise
  if (pendingPublicSettingsPromise) {
    return pendingPublicSettingsPromise;
  }
  
  // Start new request
  lastPublicSettingsCall = now;
  // Public settings require no auth — use plain fetch via apiFetch (path starts with /settings which is in PUBLIC_PATHS)
  pendingPublicSettingsPromise = apiFetch<any>('/settings').then(data => {
    cachedPublicSettings = data;
    pendingPublicSettingsPromise = null;
    return data;
  }).catch(error => {
    pendingPublicSettingsPromise = null;
    throw error;
  });
  
  return pendingPublicSettingsPromise;
};

// Activity Feed
export const getActivityFeed = async (limit: number = 20) => {
  const { data } = await api.get(`/activity/feed?limit=${limit}`);
  return data;
};

// User Settings with rate limiting to prevent infinite loops
let lastUserSettingsCall = 0;
let cachedUserSettings: any = null;
let pendingUserSettingsPromise: Promise<any> | null = null;
const USER_SETTINGS_CACHE_MS = 2000; // Cache for 2 seconds to prevent duplicate calls from multiple components

export const getUserSettings = async () => {
  const now = Date.now();
  
  // If we called this very recently, return cached data
  if (cachedUserSettings && (now - lastUserSettingsCall) < USER_SETTINGS_CACHE_MS) {
    return cachedUserSettings;
  }
  
  // If a request is already in flight, return the same promise
  if (pendingUserSettingsPromise) {
    return pendingUserSettingsPromise;
  }
  
  // Start new request
  lastUserSettingsCall = now;
  pendingUserSettingsPromise = api.get('/user/settings').then(response => {
    cachedUserSettings = response.data;
    pendingUserSettingsPromise = null; // Clear pending promise
    return response.data;
  }).catch(error => {
    pendingUserSettingsPromise = null; // Clear pending promise on error
    throw error;
  });
  
  return pendingUserSettingsPromise;
};

// Reports Settings with caching to prevent duplicate calls
let lastReportsSettingsCall = 0;
let cachedReportsSettings: any = null;
let pendingReportsSettingsPromise: Promise<any> | null = null;
const REPORTS_SETTINGS_CACHE_MS = 2000; // Cache for 2 seconds to prevent duplicate calls from Header and Reports

export const getReportsSettings = async () => {
  const now = Date.now();
  
  // If we called this very recently, return cached data
  if (cachedReportsSettings && (now - lastReportsSettingsCall) < REPORTS_SETTINGS_CACHE_MS) {
    return cachedReportsSettings;
  }
  
  // If a request is already in flight, return the same promise
  if (pendingReportsSettingsPromise) {
    return pendingReportsSettingsPromise;
  }
  
  // Start new request
  lastReportsSettingsCall = now;
  pendingReportsSettingsPromise = api.get('/reports/settings').then(response => {
    cachedReportsSettings = response.data;
    pendingReportsSettingsPromise = null; // Clear pending promise
    return response.data;
  }).catch(error => {
    pendingReportsSettingsPromise = null; // Clear pending promise on error
    throw error;
  });
  
  return pendingReportsSettingsPromise;
};

export const updateUserSetting = async (setting_key: string, setting_value: any) => {
  const { data } = await api.put('/user/settings', { setting_key, setting_value });
  // Clear cache when settings are updated
  cachedUserSettings = null;
  return data;
};

export const updateSetting = async (key: string, value: string) => {
  const { data } = await api.put('/admin/settings', { key, value });
  return data;
};

// Storage information
export const getStorageInfo = async () => {
  const { data } = await api.get('/storage/info');
  return data;
};

// System information (admin only)
export const getSystemInfo = async () => {
  const { data } = await api.get('/admin/system-info');
  return data;
};

// Tags (public endpoint for all users)
export const getAllTags = async () => {
  const { data } = await api.get('/tags');
  return data;
};

// Tags management (admin only)
export const getTags = async () => {
  const { data } = await api.get('/admin/tags');
  return data;
};

export const createTag = async (tag: { tag: string; description?: string; color?: string }) => {
  const { data } = await api.post('/admin/tags', tag);
  return data;
};

export const updateTag = async (tagId: number, tag: { tag: string; description?: string; color?: string }) => {
  const { data } = await api.put(`/admin/tags/${tagId}`, tag);
  return data;
};

export const deleteTag = async (tagId: number) => {
  const { data } = await api.delete(`/admin/tags/${tagId}`);
  return data;
};

export const getTagUsage = async (tagId: number) => {
  const { data } = await api.get(`/admin/tags/${tagId}/usage`);
  return data;
};

// Batch fetch tag usage counts (fixes N+1 problem)
export const getBatchTagUsage = async (tagIds: number[]) => {
  if (tagIds.length === 0) return {};
  const { data } = await api.get(`/admin/tags/usage/batch`, {
    params: { tagIds }
  });
  return data;
};

export const getPriorityUsage = async (priorityId: string) => {
  const { data } = await api.get(`/admin/priorities/${priorityId}/usage`);
  return data;
};

// Batch fetch priority usage counts (fixes N+1 problem)
export const getBatchPriorityUsage = async (priorityIds: string[]) => {
  if (priorityIds.length === 0) return {};
  const { data } = await api.get(`/admin/priorities/usage/batch`, {
    params: { priorityIds }
  });
  return data;
};

// Task-Tag associations
export const getTaskTags = async (taskId: string) => {
  const { data } = await api.get(`/tasks/${taskId}/tags`);
  return data;
};

export const addTagToTask = async (taskId: string, tagId: number) => {
  const { data } = await api.post(`/tasks/${taskId}/tags/${tagId}`);
  return data;
};

export const removeTagFromTask = async (taskId: string, tagId: number) => {
  const { data } = await api.delete(`/tasks/${taskId}/tags/${tagId}`);
  return data;
};

// Task-Watchers associations
export const getTaskWatchers = async (taskId: string) => {
  const { data } = await api.get(`/tasks/${taskId}/watchers`);
  return data;
};

export const addWatcherToTask = async (taskId: string, memberId: string) => {
  const { data } = await api.post(`/tasks/${taskId}/watchers/${memberId}`);
  return data;
};

export const removeWatcherFromTask = async (taskId: string, memberId: string) => {
  const { data } = await api.delete(`/tasks/${taskId}/watchers/${memberId}`);
  return data;
};

// Task-Collaborators associations
export const getTaskCollaborators = async (taskId: string) => {
  const { data } = await api.get(`/tasks/${taskId}/collaborators`);
  return data;
};

export const addCollaboratorToTask = async (taskId: string, memberId: string) => {
  const { data } = await api.post(`/tasks/${taskId}/collaborators/${memberId}`);
  return data;
};

export const removeCollaboratorFromTask = async (taskId: string, memberId: string) => {
  const { data } = await api.delete(`/tasks/${taskId}/collaborators/${memberId}`);
  return data;
};

// Priorities management
export const getAllPriorities = async () => {
  const { data } = await api.get('/priorities');
  return data;
};

// Sprints management
export const getAllSprints = async () => {
  const { data } = await api.get('/admin/sprints');
  return data.sprints || data || [];
};

export const getSprintUsage = async (sprintId: string) => {
  const { data } = await api.get(`/admin/sprints/${sprintId}/usage`);
  return data;
};

export const deleteSprint = async (sprintId: string) => {
  const { data } = await api.delete(`/admin/sprints/${sprintId}`);
  return data;
};

export const getPriorities = async () => {
  const { data } = await api.get('/admin/priorities');
  return data;
};

export const createPriority = async (priority: { priority: string; color: string }) => {
  const { data } = await api.post('/admin/priorities', priority);
  return data;
};

export const updatePriority = async (priorityId: number, priority: { priority: string; color: string }) => {
  const { data } = await api.put(`/admin/priorities/${priorityId}`, priority);
  return data;
};

export const deletePriority = async (priorityId: number) => {
  const { data } = await api.delete(`/admin/priorities/${priorityId}`);
  return data;
};

export const reorderPriorities = async (priorities: any[]) => {
  const { data } = await api.put('/admin/priorities/reorder', { priorities });
  return data;
};

export const setDefaultPriority = async (priorityId: number) => {
  const { data } = await api.put(`/admin/priorities/${priorityId}/set-default`);
  return data;
};

// Views (saved filters) management
export interface SavedFilterView {
  id: number;
  filterName: string;
  userId: string;
  shared: boolean;
  textFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
  dueDateFromFilter?: string;
  dueDateToFilter?: string;
  memberFilters?: string[];
  priorityFilters?: string[];
  tagFilters?: string[];
  projectFilter?: string;
  taskFilter?: string;
  boardColumnFilter?: string;
  created_at: string;
  updated_at: string;
  creatorName?: string; // Available for shared filters
}

export interface CreateFilterViewRequest {
  filterName: string;
  filters: {
    text?: string;
    dateFrom?: string;
    dateTo?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    selectedMembers?: string[];
    selectedPriorities?: string[];
    selectedTags?: string[];
    projectId?: string;
    taskId?: string;
    boardColumnFilter?: string;
  };
  shared?: boolean;
}

export interface UpdateFilterViewRequest {
  filterName?: string;
  filters?: {
    text?: string;
    dateFrom?: string;
    dateTo?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    selectedMembers?: string[];
    selectedPriorities?: string[];
    selectedTags?: string[];
    projectId?: string;
    taskId?: string;
    boardColumnFilter?: string;
  };
  shared?: boolean;
}

export const getSavedFilterViews = async (): Promise<SavedFilterView[]> => {
  const { data } = await api.get('/views');
  return data;
};

export const getSharedFilterViews = async (): Promise<SavedFilterView[]> => {
  const { data } = await api.get('/views/shared');
  return data;
};

export const getSavedFilterView = async (viewId: number): Promise<SavedFilterView> => {
  const { data } = await api.get(`/views/${viewId}`);
  return data;
};

export const createSavedFilterView = async (request: CreateFilterViewRequest): Promise<SavedFilterView> => {
  const { data } = await api.post('/views', request);
  return data;
};

export const updateSavedFilterView = async (viewId: number, request: UpdateFilterViewRequest): Promise<SavedFilterView> => {
  const { data } = await api.put(`/views/${viewId}`, request);
  return data;
};

export const deleteSavedFilterView = async (viewId: number): Promise<void> => {
  await api.delete(`/views/${viewId}`);
};

// Avatar management
export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);

  // Don't set Content-Type manually - browser will set it with boundary for FormData
  const { data } = await api.post<{
    message: string;
    avatarUrl: string;
  }>('/users/avatar', formData);
  return data;
};

// Task Relationships
export const getTaskRelationships = async (taskId: string) => {
  const response = await api.get(`/tasks/${taskId}/relationships`);
  return response.data;
};

export const getAvailableTasksForRelationship = async (taskId: string) => {
  const response = await api.get(`/tasks/${taskId}/available-for-relationship`);
  return response.data;
};

export const addTaskRelationship = async (taskId: string, relationship: 'parent' | 'child' | 'related', toTaskId: string) => {
  const response = await api.post(`/tasks/${taskId}/relationships`, {
    relationship,
    toTaskId
  });
  return response.data;
};

export const removeTaskRelationship = async (taskId: string, relationshipId: string) => {
  const response = await api.delete(`/tasks/${taskId}/relationships/${relationshipId}`);
  return response.data;
};

export const getBoardTaskRelationships = async (boardId: string) => {
  const response = await api.get(`/boards/${boardId}/relationships`);
  return response.data;
};

// Get complete task flow chart data (optimized)
export const getTaskFlowChart = async (taskId: string): Promise<{
  rootTaskId: string;
  tasks: Array<{
    id: string;
    ticket: string;
    title: string;
    memberId: string;
    memberName: string;
    memberColor: string;
    status: string;
    priority: string;
    startDate: string;
    dueDate: string;
    projectId: string;
  }>;
  relationships: Array<{
    id: string;
    taskId: string;
    relationship: string;
    relatedTaskId: string;
    taskTicket: string;
    relatedTaskTicket: string;
  }>;
}> => {
  const response = await api.get(`/tasks/${taskId}/flow-chart`);
  return response.data;
};

// Instance Status
export const getInstanceStatus = async (): Promise<{
  status: string;
  isActive: boolean;
  message: string;
  timestamp: string;
}> => {
  const { data } = await api.get('/auth/instance-status');
  return data;
};

// User Status
// HorusVis backend does not implement /user/status — return a safe default to prevent forced logout.
export const getUserStatus = async (): Promise<{
  isActive: boolean;
  isAdmin: boolean;
  forceLogout: boolean;
}> => {
  return { isActive: true, isAdmin: false, forceLogout: false };
};

// Notification Queue
export const getNotificationQueue = async () => {
  const response = await api.get('/admin/notification-queue');
  return response.data;
};

export const sendNotificationsImmediately = async (notificationIds: string[]) => {
  const response = await api.post('/admin/notification-queue/send', {
    notificationIds
  });
  return response.data;
};

export const deleteNotifications = async (notificationIds: string[]) => {
  const response = await api.delete('/admin/notification-queue', {
    data: { notificationIds }
  });
  return response.data;
};

export default api;