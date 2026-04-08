namespace HorusVis.Business.Contracts;

/// <summary>
/// Decouples AuthService from HorusVis.Web's JwtTokenService.
/// JwtTokenService will implement this interface (registered in Program.cs).
/// </summary>
public interface ITokenGenerator
{
    (string AccessToken, DateTimeOffset ExpiresAt) GenerateToken(
        Guid userId,
        string username,
        string email,
        string[] roles);
}
