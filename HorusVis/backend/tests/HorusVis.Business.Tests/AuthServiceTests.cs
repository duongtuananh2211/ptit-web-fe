using HorusVis.Business.Contracts;
using HorusVis.Business.Services;
using HorusVis.Data.Dao;
using HorusVis.Data.Enums;
using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Business.Tests;

public class AuthServiceTests
{
    // --------------- Manual test doubles ---------------

    private sealed class FakePasswordService : IPasswordService
    {
        private bool _verifyResult = true;

        public void SetVerifyResult(bool result) => _verifyResult = result;

        public string HashPassword(User user, string plainPassword) => $"hashed:{plainPassword}";

        public bool VerifyPassword(User user, string hashedPassword, string providedPassword)
            => _verifyResult;
    }

    private sealed class FakeTokenGenerator : ITokenGenerator
    {
        public string TokenToReturn { get; set; } = "fake-token";
        public DateTimeOffset ExpiresAt { get; set; } = DateTimeOffset.UtcNow.AddHours(1);

        public (string AccessToken, DateTimeOffset ExpiresAt) GenerateToken(
            Guid userId, string username, string email, string[] roles)
            => (TokenToReturn, ExpiresAt);
    }

    // --------------- Helpers ---------------

    private static HorusVisDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<HorusVisDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new HorusVisDbContext(options);
    }

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

    // --------------- Tests ---------------

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsAccessToken()
    {
        await using var db = CreateContext();
        var role = CreateUserRole();
        var user = CreateUser(role);
        db.Set<Role>().Add(role);
        db.Set<User>().Add(user);
        await db.SaveChangesAsync();

        var passwordService = new FakePasswordService();
        passwordService.SetVerifyResult(true);
        var tokenGenerator = new FakeTokenGenerator { TokenToReturn = "fake-token" };
        var sut = new AuthenticationService(new UserDao(db), new RoleDao(db), new UserSessionDao(db), passwordService, tokenGenerator, new RefreshTokenService());

        var result = await sut.LoginAsync("testuser", "secret");

        Assert.Equal("fake-token", result.AccessToken);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ThrowsUnauthorized()
    {
        await using var db = CreateContext();
        var role = CreateUserRole();
        var user = CreateUser(role);
        db.Set<Role>().Add(role);
        db.Set<User>().Add(user);
        await db.SaveChangesAsync();

        var passwordService = new FakePasswordService();
        passwordService.SetVerifyResult(false);
        var sut = new AuthenticationService(new UserDao(db), new RoleDao(db), new UserSessionDao(db), passwordService, new FakeTokenGenerator(), new RefreshTokenService());

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => sut.LoginAsync("testuser", "wrong-password"));
    }

    [Fact]
    public async Task LoginAsync_WithUnknownUser_ThrowsUnauthorized()
    {
        await using var db = CreateContext();
        var sut = new AuthenticationService(new UserDao(db), new RoleDao(db), new UserSessionDao(db), new FakePasswordService(), new FakeTokenGenerator(), new RefreshTokenService());

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => sut.LoginAsync("nobody", "secret"));
    }

    [Fact]
    public async Task RegisterAsync_WithNewUser_CreatesUserWithHashedPassword()
    {
        await using var db = CreateContext();
        var role = CreateUserRole();
        db.Set<Role>().Add(role);
        await db.SaveChangesAsync();

        var sut = new AuthenticationService(new UserDao(db), new RoleDao(db), new UserSessionDao(db), new FakePasswordService(), new FakeTokenGenerator(), new RefreshTokenService());

        await sut.RegisterAsync("newuser", "new@example.com", "New User", "P@ssword1");
        await db.SaveChangesAsync(); // simulate controller UoW commit

        var saved = await db.Set<User>().FirstOrDefaultAsync(u => u.Username == "newuser");
        Assert.NotNull(saved);
        Assert.Equal("hashed:P@ssword1", saved.PasswordHash);
    }

    [Fact]
    public async Task RegisterAsync_WithDuplicateUsername_ThrowsInvalidOperation()
    {
        await using var db = CreateContext();
        var role = CreateUserRole();
        var user = CreateUser(role);
        db.Set<Role>().Add(role);
        db.Set<User>().Add(user);
        await db.SaveChangesAsync();

        var sut = new AuthenticationService(new UserDao(db), new RoleDao(db), new UserSessionDao(db), new FakePasswordService(), new FakeTokenGenerator(), new RefreshTokenService());

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.RegisterAsync("testuser", "other@example.com", "Other User", "P@ssword1"));
    }
}
