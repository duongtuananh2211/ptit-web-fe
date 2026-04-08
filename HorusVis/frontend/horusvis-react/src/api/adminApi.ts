import {
  apiDeleteAuth,
  apiGetAuth,
  apiPostAuth,
  apiPutAuth,
} from "./httpClient";

export type UserAdminDto = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roleCode: string;
  roleName: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
};

export type PagedUsersResponse = {
  data: UserAdminDto[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type CreateUserRequest = {
  username: string;
  email: string;
  fullName: string;
  password: string;
  roleCode: string;
};

export type UpdateUserRequest = {
  fullName?: string;
  email?: string;
  status?: string;
  roleCode?: string;
};

export type PermissionScopeDto = {
  id: string;
  scope: string;
  description: string | null;
};

export type RoleAdminDto = {
  id: string;
  roleCode: string;
  roleName: string;
  isSystem: boolean;
  permissions: PermissionScopeDto[];
};

export type SessionAdminDto = {
  id: string;
  userId: string;
  userEmail: string;
  createdAt: string;
  lastUsedAt: string | null;
  refreshTokenExpiresAt: string;
  revokedAt: string | null;
  displayStatus: "Active" | "Expired" | "Revoked";
};

export type MetricsDto = {
  totalUsers: number;
  activeSessions: number;
  avgCpuLoadPercent: number;
  avgMemoryLoadPercent: number;
};

export type NodeAdminDto = {
  id: string;
  nodeName: string;
  environment: string;
  cpuLoadPercent: number | null;
  memoryLoadPercent: number | null;
  status: string;
  lastHeartbeatAt: string | null;
};

export type DeploymentAdminDto = {
  id: string;
  environment: string;
  versionLabel: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  triggeredByUserEmail: string | null;
};

export type HealthResponse = {
  status: string;
  checks: Array<{ name: string; status: string }>;
};

export function fetchAdminUsers(
  token: string,
  cursor?: string,
  pageSize?: number,
): Promise<PagedUsersResponse> {
  const params = new URLSearchParams();
  if (cursor != null) params.set("cursor", cursor);
  if (pageSize != null) params.set("pageSize", String(pageSize));
  const query = params.toString();
  const path = query ? `/api/admin/users?${query}` : "/api/admin/users";
  return apiGetAuth<PagedUsersResponse>(path, token);
}

export function createAdminUser(
  req: CreateUserRequest,
  token: string,
): Promise<UserAdminDto> {
  return apiPostAuth<UserAdminDto>("/api/admin/users", req, token);
}

export function updateAdminUser(
  userId: string,
  req: UpdateUserRequest,
  token: string,
): Promise<UserAdminDto> {
  return apiPutAuth<UserAdminDto>(`/api/admin/users/${userId}`, req, token);
}

export function fetchAdminRoles(token: string): Promise<RoleAdminDto[]> {
  return apiGetAuth<RoleAdminDto[]>("/api/admin/roles", token);
}

export function updateRolePermissions(
  roleId: string,
  permissionScopes: string[],
  token: string,
): Promise<void> {
  return apiPutAuth<void>(
    `/api/admin/roles/${roleId}`,
    { permissionScopes },
    token,
  );
}

export function fetchAdminSessions(token: string): Promise<SessionAdminDto[]> {
  return apiGetAuth<SessionAdminDto[]>("/api/admin/sessions", token);
}

export function revokeSession(
  sessionId: string,
  token: string,
): Promise<void> {
  return apiDeleteAuth(`/api/admin/sessions/${sessionId}`, token);
}

export function fetchAdminMetrics(token: string): Promise<MetricsDto> {
  return apiGetAuth<MetricsDto>("/api/admin/metrics", token);
}

export function fetchAdminNodes(token: string): Promise<NodeAdminDto[]> {
  return apiGetAuth<NodeAdminDto[]>("/api/admin/nodes", token);
}

export function fetchAdminHealth(token: string): Promise<HealthResponse> {
  return apiGetAuth<HealthResponse>("/api/admin/health", token);
}

export function fetchDeployments(
  take: number,
  token: string,
): Promise<DeploymentAdminDto[]> {
  return apiGetAuth<DeploymentAdminDto[]>(
    `/api/deployments?take=${take}`,
    token,
  );
}
