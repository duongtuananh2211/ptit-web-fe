using HorusVis.Business.Contracts;
using HorusVis.Business.Services;
using HorusVis.Data.Dao;
using HorusVis.Data.Enums;
using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Business.Tests;

public class AuthServiceRefreshTests
{
    // --------------- Test doubles ---------------

    private sealed class FakePasswordService : IPasswordService
    {
        public string HashPassword(User user, string plainPassword) => $"hashed:{plainPassword}";
        public bool VerifyPassword(User user, string hashedPassword, string providedPassword) => true;
    }

    private sealed class FakeTokenGenerator : ITokenGenerator
    {
        public (string AccessToken, DateTimeOffset ExpiresAt) GenerateToken(
            Guid userId, string username, string email, string[] roles)
            => ("fake-access-token", DateTimeOffset.UtcNow.AddHours(1));
    }

    // --------------- Helpers ---------------

    private static HorusVisDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<HorusVisDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new HorusVisDbContext(options);
    }

    private static AuthenticationService CreateSut(HorusVisDbContext db)
        => new(new UserDao(db), new RoleDao(db), new UserSessionDao(db), new FakePasswordService(), new FakeTokenGenerator(), new RefreshTokenService());

    private static Role CreateUserRole() => new()
    {
        Id = Guid.NewGuid(),
        RoleCode = "user",
        RoleName = "User",
    };

    private static User CreateUser(Role role) => new()
    {
        Id = Guid.NewGuid(),
        Username = "testuser",
        Email = "test@example.com",
        PasswordHash = "hashed:secret",
        FullName = "Test User",
        RoleId = role.Id,
        Status = UserStatus.Active,
        CreatedAt = DateTimeOffset.UtcNow,
    };

    private static UserSession CreateActiveSession(Guid userId, string tokenHash) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        RefreshTokenHash = tokenHash,
        Status = UserSessionStatus.Active,
        CreatedAt = DateTimeOffset.UtcNow,
        LastUsedAt = DateTimeOffset.UtcNow,
        RefreshTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(14),
    };

    // --------------- Tests ---------------

    [Fact]
    public async Task RefreshAsync_WithValidToken_ReturnsNewTokenPairAndRevokesOldSession()
    {
        await using var db = CreateContext();
        var role = CreateUserRole();
        var user = CreateUser(role);
        db.Set<Role>().Add(role);
        db.Set<User>().Add(user);

        var svc = new RefreshTokenService();
        var rawToken = svc.GenerateRawToken();
        var tokenHash = svc.HashToken(rawToken);

        var session = CreateActiveSession(user.Id, tokenHash);
        db.Set<UserSession>().Add(session);
        await db.SaveChangesAsync();

        var sut = CreateSut(db);
        var result = await sut.RefreshAsync(rawToken);

        Assert.NotNull(result);
        Assert.NotEqual(rawToken, result.RawRefreshToken);
        Assert.Equal("fake-access-token", result.AccessToken);

        var oldSession = await db.Set<UserSession>().FindAsync(session.Id);
        Assert.NotNull(oldSession!.RevokedAt);
        Assert.Equal(UserSessionStatus.Revoked, oldSession.Status);
    }

    [Fact]
    public async Task RefreshAsync_WithExpiredSession_ThrowsUnauthorized()
    {
        await using var db = CreateContext();
        var role = CreateUserRole();
        var user = CreateUser(role);
        db.Set<Role>().Add(role);
        db.Set<User>().Add(user);

        var svc = new RefreshTokenService();
        var rawToken = svc.GenerateRawToken();
        var tokenHash = svc.HashToken(rawToken);

        var expiredSession = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RefreshTokenHash = tokenHash,
            Status = UserSessionStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-30),
            LastUsedAt = DateTimeOffset.UtcNow.AddDays(-30),
            RefreshTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(-1),
        };
        db.Set<UserSession>().Add(expiredSession);
        await db.SaveChangesAsync();

        var sut = CreateSut(db);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => sut.RefreshAsync(rawToken));
    }

    [Fact]
    public async Task RefreshAsync_WithRevokedToken_RevokesAllSessionsAndThrows()
    {
        await using var db = CreateContext();
        var role = CreateUserRole();
        var user = CreateUser(role);
        db.Set<Role>().Add(role);
        db.Set<User>().Add(user);

        var svc = new RefreshTokenService();

        var revokedRawToken = svc.GenerateRawToken();
        var revokedHash = svc.HashToken(revokedRawToken);

        var revokedSession = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RefreshTokenHash = revokedHash,
            Status = UserSessionStatus.Revoked,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-2),
            LastUsedAt = DateTimeOffset.UtcNow.AddDays(-2),
            RefreshTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(12),
            RevokedAt = DateTimeOffset.UtcNow.AddDays(-1),
        };

        var activeRawToken = svc.GenerateRawToken();
        var activeHash = svc.HashToken(activeRawToken);
        var activeSession = CreateActiveSession(user.Id, activeHash);

        db.Set<UserSession>().Add(revokedSession);
        db.Set<UserSession>().Add(activeSession);
        await db.SaveChangesAsync();

        var sut = CreateSut(db);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => sut.RefreshAsync(revokedRawToken));

        var nowActive = await db.Set<UserSession>()
            .Where(s => s.UserId == user.Id && s.RevokedAt == null)
            .ToListAsync();

        Assert.Empty(nowActive);
    }

    [Fact]
    public async Task LogoutAsync_WithValidToken_RevokesSession()
    {
        await using var db = CreateContext();
        var role = CreateUserRole();
        var user = CreateUser(role);
        db.Set<Role>().Add(role);
        db.Set<User>().Add(user);

        var svc = new RefreshTokenService();
        var rawToken = svc.GenerateRawToken();
        var tokenHash = svc.HashToken(rawToken);

        var session = CreateActiveSession(user.Id, tokenHash);
        db.Set<UserSession>().Add(session);
        await db.SaveChangesAsync();

        var sut = CreateSut(db);
        await sut.LogoutAsync(rawToken);

        var saved = await db.Set<UserSession>().FindAsync(session.Id);
        Assert.NotNull(saved!.RevokedAt);
        Assert.Equal(UserSessionStatus.Revoked, saved.Status);
    }

    [Fact]
    public async Task LogoutAsync_WithUnknownToken_DoesNotThrow()
    {
        await using var db = CreateContext();
        var svc = new RefreshTokenService();
        var rawToken = svc.GenerateRawToken();

        var sut = CreateSut(db);

        var ex = await Record.ExceptionAsync(() => sut.LogoutAsync(rawToken));
        Assert.Null(ex);
    }
}
