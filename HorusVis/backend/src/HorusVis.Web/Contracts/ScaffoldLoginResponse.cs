namespace HorusVis.Web.Contracts;

public sealed record ScaffoldLoginResponse(
    string AccessToken,
    DateTimeOffset ExpiresAtUtc,
    string TokenType,
    string UserId,
    string UserName,
    string[] Roles);
