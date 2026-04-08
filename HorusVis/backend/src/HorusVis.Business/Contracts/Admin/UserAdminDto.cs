namespace HorusVis.Business.Contracts.Admin;

public sealed record UserAdminDto(
    Guid Id,
    string Username,
    string Email,
    string FullName,
    string RoleCode,
    string RoleName,
    string Status,
    DateTimeOffset? LastLoginAt,
    DateTimeOffset CreatedAt);
