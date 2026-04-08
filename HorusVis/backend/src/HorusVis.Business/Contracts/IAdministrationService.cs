using HorusVis.Business.Contracts.Admin;

namespace HorusVis.Business.Contracts;

public interface IAdministrationService
{
    // Users
    Task<PagedUsersResponse> ListUsersAsync(Guid? cursor, int pageSize, CancellationToken ct = default);
    Task<UserAdminDto> CreateUserAsync(CreateUserRequest request, CancellationToken ct = default);
    Task<UserAdminDto> UpdateUserAsync(Guid userId, UpdateUserRequest request, CancellationToken ct = default);

    // Roles
    Task<List<RoleAdminDto>> ListRolesAsync(CancellationToken ct = default);
    Task UpdateRolePermissionsAsync(Guid roleId, List<string> permissionScopes, CancellationToken ct = default);

    // Sessions
    Task<List<SessionAdminDto>> ListSessionsAsync(CancellationToken ct = default);
    Task RevokeSessionAsync(Guid sessionId, CancellationToken ct = default);

    // Metrics & nodes
    Task<MetricsDto> GetMetricsAsync(CancellationToken ct = default);
    Task<List<NodeAdminDto>> ListNodesAsync(CancellationToken ct = default);

    // Deployments
    Task<List<DeploymentAdminDto>> ListDeploymentsAsync(int take, CancellationToken ct = default);
}
