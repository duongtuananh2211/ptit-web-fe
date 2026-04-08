namespace HorusVis.Business.Contracts;

public record AuthResult(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RawRefreshToken,
    DateTimeOffset RefreshTokenExpiresAt);
