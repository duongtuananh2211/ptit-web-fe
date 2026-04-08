namespace HorusVis.Business.Contracts.Admin;

public sealed record UpdateUserRequest(
    string? FullName,
    string? Email,
    string? Status,
    string? RoleCode);
