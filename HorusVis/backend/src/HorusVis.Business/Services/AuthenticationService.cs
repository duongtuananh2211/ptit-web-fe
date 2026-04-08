using HorusVis.Business.Contracts;
using HorusVis.Data.Dao;
using HorusVis.Data.Enums;
using HorusVis.Data.Horusvis.Entities;

namespace HorusVis.Business.Services;

public sealed class AuthenticationService(
    IUserDao userDao,
    IRoleDao roleDao,
    IUserSessionDao userSessionDao,
    IPasswordService passwordService,
    ITokenGenerator tokenGenerator,
    IRefreshTokenService refreshTokenService) : IAuthenticationService
{
    public async Task<AuthResult> LoginAsync(string usernameOrEmail, string password, CancellationToken ct = default)
    {
        var user = await userDao.FindByUsernameOrEmailAsync(usernameOrEmail, ct);

        if (user is null || !passwordService.VerifyPassword(user, user.PasswordHash, password))
            throw new UnauthorizedAccessException("Invalid credentials");

        var roles = new[] { user.Role.RoleCode };
        var (accessToken, expiresAt) = tokenGenerator.GenerateToken(
            user.Id, user.Username, user.Email, roles);

        var rawToken = refreshTokenService.GenerateRawToken();
        var tokenHash = refreshTokenService.HashToken(rawToken);

        user.LastLoginAt = DateTimeOffset.UtcNow;

        var now = DateTimeOffset.UtcNow;
        userSessionDao.Add(new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RefreshTokenHash = tokenHash,
            Status = UserSessionStatus.Active,
            CreatedAt = now,
            LastUsedAt = now,
            RefreshTokenExpiresAt = now.AddDays(14),
        });

        // No SaveChanges — controller commits via IUnitOfWorkService
        return new AuthResult(accessToken, expiresAt, rawToken, now.AddDays(14));
    }

    public async Task RegisterAsync(
        string username,
        string email,
        string fullName,
        string password,
        CancellationToken ct = default)
    {
        if (await userDao.ExistsByUsernameAsync(username, ct))
            throw new InvalidOperationException("Username already taken");

        if (await userDao.ExistsByEmailAsync(email, ct))
            throw new InvalidOperationException("Email already taken");

        var role = await roleDao.FindByRoleCodeAsync("user", ct)
            ?? throw new InvalidOperationException("Default user role not found in database");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            Email = email,
            PasswordHash = string.Empty,
            FullName = fullName,
            RoleId = role.Id,
            Status = UserStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        user.PasswordHash = passwordService.HashPassword(user, password);
        userDao.Add(user);

        // No SaveChanges — controller commits via IUnitOfWorkService
    }

    public async Task<AuthResult> RefreshAsync(string rawRefreshToken, CancellationToken ct = default)
    {
        var tokenHash = refreshTokenService.HashToken(rawRefreshToken);

        var session = await userSessionDao.FindActiveByTokenHashAsync(tokenHash, ct);

        if (session is null)
        {
            var revokedSession = await userSessionDao.FindRevokedByTokenHashAsync(tokenHash, ct);

            if (revokedSession is not null)
            {
                // Replay attack: persist revocations immediately before throwing so they
                // survive even though the controller will not call SaveChangesAsync.
                await userSessionDao.RevokeAllActiveSessionsForUserAsync(
                    revokedSession.UserId, DateTimeOffset.UtcNow, ct);

                throw new UnauthorizedAccessException("Refresh token reuse detected \u2014 all sessions revoked");
            }

            throw new UnauthorizedAccessException("Invalid refresh token");
        }

        if (session.RefreshTokenExpiresAt < DateTimeOffset.UtcNow)
            throw new UnauthorizedAccessException("Refresh token expired");

        var now = DateTimeOffset.UtcNow;
        session.RevokedAt = now;
        session.Status = UserSessionStatus.Revoked;

        var newRawToken = refreshTokenService.GenerateRawToken();
        var newHash = refreshTokenService.HashToken(newRawToken);

        var user = await userDao.FindByIdAsync(session.UserId, ct)
            ?? throw new UnauthorizedAccessException("User not found");

        userSessionDao.Add(new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RefreshTokenHash = newHash,
            CreatedAt = now,
            LastUsedAt = now,
            RefreshTokenExpiresAt = now.AddDays(14),
            Status = UserSessionStatus.Active,
        });

        var roles = new[] { user.Role.RoleCode };
        var (newAccessToken, expiresAt) = tokenGenerator.GenerateToken(
            user.Id, user.Username, user.Email, roles);

        // No SaveChanges — controller commits via IUnitOfWorkService
        return new AuthResult(newAccessToken, expiresAt, newRawToken, now.AddDays(14));
    }

    public async Task LogoutAsync(string rawRefreshToken, CancellationToken ct = default)
    {
        var tokenHash = refreshTokenService.HashToken(rawRefreshToken);

        var session = await userSessionDao.FindActiveByTokenHashAsync(tokenHash, ct);

        if (session is null)
            return; // idempotent \u2014 nothing to revoke

        session.RevokedAt = DateTimeOffset.UtcNow;
        session.Status = UserSessionStatus.Revoked;

        // No SaveChanges \u2014 controller commits via IUnitOfWorkService
    }
}
