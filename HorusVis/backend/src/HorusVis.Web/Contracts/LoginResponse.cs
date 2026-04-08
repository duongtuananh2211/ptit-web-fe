namespace HorusVis.Web.Contracts;

public record LoginResponse(
    string AccessToken,
    DateTimeOffset ExpiresAt);
