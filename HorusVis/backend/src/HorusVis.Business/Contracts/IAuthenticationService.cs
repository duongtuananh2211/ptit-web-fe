namespace HorusVis.Business.Contracts;

public interface IAuthenticationService
{
    Task<AuthResult> LoginAsync(string usernameOrEmail, string password, CancellationToken ct = default);
    Task RegisterAsync(string username, string email, string fullName, string password, CancellationToken ct = default);
    Task<AuthResult> RefreshAsync(string rawRefreshToken, CancellationToken ct = default);
    Task LogoutAsync(string rawRefreshToken, CancellationToken ct = default);
}
