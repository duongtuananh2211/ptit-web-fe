// All API calls now go through useHorusVisClient() from components/DataProvider.
// Types are re-exported here for backward compatibility.

export type {
  UserAdminDto,
  PagedUsersResponse,
  PermissionScopeDto,
  RoleAdminDto,
  SessionAdminDto,
  MetricsDto,
  NodeAdminDto,
  DeploymentAdminDto,
} from "./clients";
export { CreateUserRequest, UpdateUserRequest, UpdateRoleRequest } from "./clients";
