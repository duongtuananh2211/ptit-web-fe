import {
  AdminUsersClient,
  AdminMetricsClient,
  AdminRolesClient,
  AdminSessionsClient,
  DeploymentsClient,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateRoleRequest,
  SwaggerResponse,
} from "@horusvis-web/Reference";

// --- DTO types (backend does not emit ProducesResponseType, so NSwag generates void) ---

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

export { CreateUserRequest, UpdateUserRequest, UpdateRoleRequest };

// --- Helper to parse JSON body into a SwaggerResponse ---

function parseJson<T>(response: Response): Promise<SwaggerResponse<T>> {
  const status = response.status;
  const headers: Record<string, string> = {};
  if (response.headers?.forEach) {
    response.headers.forEach((v, k) => (headers[k] = v));
  }
  if (status === 200 || status === 201) {
    return response.json().then((data) => new SwaggerResponse(status, headers, data as T));
  }
  return response.text().then((text) => {
    throw new Error(`Request failed with status ${status}: ${text}`);
  });
}

// --- Typed client subclasses ---
// Override process* methods to parse response body into the correct DTO type.
// Public helper methods provide a clean, typed API for components.

export class TypedAdminUsersClient extends AdminUsersClient {
  protected override processUsersGET(r: Response): Promise<SwaggerResponse<void>> {
    return parseJson<PagedUsersResponse>(r) as unknown as Promise<SwaggerResponse<void>>;
  }
  protected override processUsersPOST(r: Response): Promise<SwaggerResponse<void>> {
    return parseJson<UserAdminDto>(r) as unknown as Promise<SwaggerResponse<void>>;
  }
  protected override processUsersPUT(r: Response): Promise<SwaggerResponse<void>> {
    return parseJson<UserAdminDto>(r) as unknown as Promise<SwaggerResponse<void>>;
  }

  async getUsers(cursor?: string, pageSize?: number): Promise<PagedUsersResponse> {
    const resp = await this.usersGET(cursor, pageSize);
    return (resp as unknown as SwaggerResponse<PagedUsersResponse>).result;
  }
  async createUser(req: CreateUserRequest): Promise<UserAdminDto> {
    const resp = await this.usersPOST(req);
    return (resp as unknown as SwaggerResponse<UserAdminDto>).result;
  }
  async updateUser(userId: string, req: UpdateUserRequest): Promise<UserAdminDto> {
    const resp = await this.usersPUT(userId, req);
    return (resp as unknown as SwaggerResponse<UserAdminDto>).result;
  }
}

export class TypedAdminRolesClient extends AdminRolesClient {
  protected override processRolesGET(r: Response): Promise<SwaggerResponse<void>> {
    return parseJson<RoleAdminDto[]>(r) as unknown as Promise<SwaggerResponse<void>>;
  }

  async getRoles(): Promise<RoleAdminDto[]> {
    const resp = await this.rolesGET();
    return (resp as unknown as SwaggerResponse<RoleAdminDto[]>).result;
  }
  async updateRolePermissions(roleId: string, permissionScopes: string[]): Promise<void> {
    await this.rolesPUT(roleId, new UpdateRoleRequest({ permissionScopes }));
  }
}

export class TypedAdminSessionsClient extends AdminSessionsClient {
  protected override processSessionsGET(r: Response): Promise<SwaggerResponse<void>> {
    return parseJson<SessionAdminDto[]>(r) as unknown as Promise<SwaggerResponse<void>>;
  }

  async getSessions(): Promise<SessionAdminDto[]> {
    const resp = await this.sessionsGET();
    return (resp as unknown as SwaggerResponse<SessionAdminDto[]>).result;
  }
  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionsDELETE(sessionId);
  }
}

export class TypedAdminMetricsClient extends AdminMetricsClient {
  protected override processMetrics(r: Response): Promise<SwaggerResponse<void>> {
    return parseJson<MetricsDto>(r) as unknown as Promise<SwaggerResponse<void>>;
  }
  protected override processNodes(r: Response): Promise<SwaggerResponse<void>> {
    return parseJson<NodeAdminDto[]>(r) as unknown as Promise<SwaggerResponse<void>>;
  }

  async getMetrics(): Promise<MetricsDto> {
    const resp = await this.metrics();
    return (resp as unknown as SwaggerResponse<MetricsDto>).result;
  }
  async getNodes(): Promise<NodeAdminDto[]> {
    const resp = await this.nodes();
    return (resp as unknown as SwaggerResponse<NodeAdminDto[]>).result;
  }
}

export class TypedDeploymentsClient extends DeploymentsClient {
  protected override processDeployments(r: Response): Promise<SwaggerResponse<void>> {
    return parseJson<DeploymentAdminDto[]>(r) as unknown as Promise<SwaggerResponse<void>>;
  }

  async getDeployments(take?: number): Promise<DeploymentAdminDto[]> {
    const resp = await this.deployments(take);
    return (resp as unknown as SwaggerResponse<DeploymentAdminDto[]>).result;
  }
}
