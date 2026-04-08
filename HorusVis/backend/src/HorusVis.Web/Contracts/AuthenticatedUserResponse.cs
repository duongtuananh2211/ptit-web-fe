namespace HorusVis.Web.Contracts;

public sealed record AuthenticatedUserResponse(
    string UserId,
    string UserName,
    string? Email,
    string[] Roles);
