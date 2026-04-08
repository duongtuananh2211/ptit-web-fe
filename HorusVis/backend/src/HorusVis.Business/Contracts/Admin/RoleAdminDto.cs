namespace HorusVis.Business.Contracts.Admin;

public sealed record PermissionScopeDto(Guid Id, string Scope, string? Description);

public sealed record RoleAdminDto(
    Guid Id,
    string RoleCode,
    string RoleName,
    bool IsSystem,
    List<PermissionScopeDto> Permissions);

public sealed record UpdateRoleRequest(List<string> PermissionScopes);
