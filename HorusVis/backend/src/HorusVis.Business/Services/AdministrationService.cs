using HorusVis.Business.Contracts;
using HorusVis.Business.Contracts.Admin;
using HorusVis.Data.Dao;
using HorusVis.Data.Enums;
using HorusVis.Data.Horusvis.Entities;

namespace HorusVis.Business.Services;

public sealed class AdministrationService(
    IUserDao userDao,
    IRoleDao roleDao,
    IUserSessionDao userSessionDao,
    IPermissionDao permissionDao,
    ISystemNodeDao systemNodeDao,
    IDeploymentDao deploymentDao,
    IPasswordService passwordService) : IAdministrationService
{
    public async Task<PagedUsersResponse> ListUsersAsync(
        Guid? cursor, int pageSize, CancellationToken ct = default)
    {
        var (items, hasMore) = await userDao.ListPageAsync(cursor, pageSize, ct);
        var dtos = items.Select(ToDto).ToList();
        var nextCursor = hasMore ? dtos.LastOrDefault()?.Id.ToString() : null;
        return new PagedUsersResponse(dtos, nextCursor, hasMore);
    }

    public async Task<UserAdminDto> CreateUserAsync(
        CreateUserRequest request, CancellationToken ct = default)
    {
        if (await userDao.ExistsByUsernameAsync(request.Username, ct))
            throw new InvalidOperationException("Username already taken.");

        if (await userDao.ExistsByEmailAsync(request.Email, ct))
            throw new InvalidOperationException("Email already taken.");

        var role = await roleDao.FindByRoleCodeAsync(request.RoleCode, ct)
            ?? throw new InvalidOperationException($"Role '{request.RoleCode}' not found.");

        var user = new User
        {
            Id           = Guid.NewGuid(),
            Username     = request.Username,
            Email        = request.Email,
            FullName     = request.FullName,
            PasswordHash = string.Empty,
            RoleId       = role.Id,
            Status       = UserStatus.Active,
            CreatedAt    = DateTimeOffset.UtcNow,
        };

        user.PasswordHash = passwordService.HashPassword(user, request.Password);
        userDao.Add(user);

        // No SaveChanges — controller commits via IUnitOfWorkService
        return ToDto(user, role);
    }

    public async Task<UserAdminDto> UpdateUserAsync(
        Guid userId, UpdateUserRequest request, CancellationToken ct = default)
    {
        var user = await userDao.FindByIdAsync(userId, ct)
            ?? throw new KeyNotFoundException($"User '{userId}' not found.");

        if (request.FullName is not null)
            user.FullName = request.FullName;

        if (request.Email is not null)
        {
            if (!string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase)
                && await userDao.ExistsByEmailAsync(request.Email, ct))
                throw new InvalidOperationException("Email already taken.");
            user.Email = request.Email;
        }

        if (request.Status is not null)
        {
            if (!Enum.TryParse<UserStatus>(request.Status, ignoreCase: true, out var status))
                throw new InvalidOperationException($"Invalid status value '{request.Status}'.");
            user.Status = status;
        }

        if (request.RoleCode is not null)
        {
            var role = await roleDao.FindByRoleCodeAsync(request.RoleCode, ct)
                ?? throw new InvalidOperationException($"Role '{request.RoleCode}' not found.");
            user.RoleId = role.Id;
        }

        // No SaveChanges — controller commits via IUnitOfWorkService
        return ToDto(user);
    }
    // ── Roles ──────────────────────────────────────────────────────────────────

    public async Task<List<RoleAdminDto>> ListRolesAsync(CancellationToken ct = default)
    {
        var roles = await roleDao.ListAllWithPermissionsAsync(ct);
        return roles.Select(r => new RoleAdminDto(
            r.Id, r.RoleCode, r.RoleName, r.IsSystem,
            r.RolePermissions.Select(rp =>
                new PermissionScopeDto(rp.Permission.Id, rp.Permission.Scope, rp.Permission.Description))
             .ToList())).ToList();
    }

    public async Task UpdateRolePermissionsAsync(
        Guid roleId, List<string> permissionScopes, CancellationToken ct = default)
    {
        var role = await roleDao.FindByIdAsync(roleId, ct)
            ?? throw new KeyNotFoundException($"Role '{roleId}' not found.");

        if (role.IsSystem)
            throw new InvalidOperationException("System roles cannot be modified.");

        var allPermissions = await permissionDao.ListAllAsync(ct);
        var matched = allPermissions
            .Where(p => permissionScopes.Contains(p.Scope, StringComparer.OrdinalIgnoreCase))
            .ToList();

        await roleDao.RemoveAllPermissionsAsync(roleId, ct);

        var now = DateTimeOffset.UtcNow;
        foreach (var perm in matched)
            roleDao.AddPermission(new RolePermission
            {
                Id           = Guid.NewGuid(),
                RoleId       = roleId,
                PermissionId = perm.Id,
                GrantedAt    = now,
            });

        // No SaveChanges — controller commits
    }

    // ── Sessions ────────────────────────────────────────────────────────────────

    public async Task<List<SessionAdminDto>> ListSessionsAsync(CancellationToken ct = default)
    {
        var sessions = await userSessionDao.ListRecentAsync(50, ct);
        var now = DateTimeOffset.UtcNow;
        return sessions.Select(s => new SessionAdminDto(
            s.Id, s.UserId, s.User.Email,
            s.CreatedAt, s.LastUsedAt, s.RefreshTokenExpiresAt, s.RevokedAt,
            s.RevokedAt.HasValue          ? "Revoked"
            : s.RefreshTokenExpiresAt < now ? "Expired"
            :                               "Active")).ToList();
    }

    public async Task RevokeSessionAsync(Guid sessionId, CancellationToken ct = default)
    {
        var session = await userSessionDao.FindByIdAsync(sessionId, ct)
            ?? throw new KeyNotFoundException($"Session '{sessionId}' not found.");

        if (session.RevokedAt.HasValue) return; // idempotent

        await userSessionDao.RevokeByIdAsync(sessionId, DateTimeOffset.UtcNow, ct);
        // RevokeByIdAsync commits immediately (security-critical, same as RevokeAll)
    }

    // ── Metrics & Nodes ─────────────────────────────────────────────────────────

    public async Task<MetricsDto> GetMetricsAsync(CancellationToken ct = default)
    {
        var totalUsers     = await userDao.CountActiveAsync(ct);
        var activeSessions = await userSessionDao.CountActiveAsync(ct);
        var nodes          = await systemNodeDao.ListAllAsync(ct);

        var avgCpu = nodes.Count > 0
            ? nodes.Average(n => n.CpuLoadPercent ?? 0)
            : 0m;
        var avgMem = nodes.Count > 0
            ? nodes.Average(n => n.MemoryLoadPercent ?? 0)
            : 0m;

        return new MetricsDto(totalUsers, activeSessions, avgCpu, avgMem);
    }

    public async Task<List<NodeAdminDto>> ListNodesAsync(CancellationToken ct = default)
    {
        var nodes = await systemNodeDao.ListAllAsync(ct);
        return nodes.Select(n => new NodeAdminDto(
            n.Id, n.NodeName, n.Environment,
            n.CpuLoadPercent, n.MemoryLoadPercent,
            n.Status.ToString(), n.LastHeartbeatAt)).ToList();
    }

    // ── Deployments ─────────────────────────────────────────────────────────────

    public async Task<List<DeploymentAdminDto>> ListDeploymentsAsync(
        int take, CancellationToken ct = default)
    {
        var deployments = await deploymentDao.ListRecentAsync(take, ct);
        return deployments.Select(d => new DeploymentAdminDto(
            d.Id, d.Environment, d.VersionLabel,
            d.StartedAt, d.FinishedAt,
            d.Status.ToString(),
            d.TriggeredByUser?.Email)).ToList();
    }
    // ── helpers ──────────────────────────────────────────────────────────────

    private static UserAdminDto ToDto(User user) =>
        new(user.Id, user.Username, user.Email, user.FullName,
            user.Role.RoleCode, user.Role.RoleName,
            user.Status.ToString(), user.LastLoginAt, user.CreatedAt);

    private static UserAdminDto ToDto(User user, Role role) =>
        new(user.Id, user.Username, user.Email, user.FullName,
            role.RoleCode, role.RoleName,
            user.Status.ToString(), user.LastLoginAt, user.CreatedAt);
}
