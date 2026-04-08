using HorusVis.Business.Services;
using HorusVis.Data.Enums;
using HorusVis.Data.Horusvis.Entities;
using Microsoft.AspNetCore.Identity;

namespace HorusVis.Business.Tests;

public class PasswordServiceTests
{
    private static readonly IPasswordHasher<User> Hasher = new PasswordHasher<User>();
    private readonly PasswordService _sut = new(Hasher);

    private static User CreateUser() => new()
    {
        Id = Guid.NewGuid(),
        Username = "testuser",
        Email = "test@example.com",
        PasswordHash = string.Empty,
        FullName = "Test User",
        RoleId = Guid.NewGuid(),
        Status = UserStatus.Active,
        CreatedAt = DateTimeOffset.UtcNow,
    };

    [Fact]
    public void HashPassword_ReturnsNonEmptyHash()
    {
        var user = CreateUser();
        var hash = _sut.HashPassword(user, "P@ssword1");
        Assert.False(string.IsNullOrEmpty(hash));
    }

    [Fact]
    public void VerifyPassword_WithCorrectPassword_ReturnsTrue()
    {
        var user = CreateUser();
        const string password = "P@ssword1";
        var hash = _sut.HashPassword(user, password);
        Assert.True(_sut.VerifyPassword(user, hash, password));
    }

    [Fact]
    public void VerifyPassword_WithWrongPassword_ReturnsFalse()
    {
        var user = CreateUser();
        var hash = _sut.HashPassword(user, "P@ssword1");
        Assert.False(_sut.VerifyPassword(user, hash, "WrongPassword"));
    }

    [Fact]
    public void HashPassword_SameInput_ReturnsDifferentHashes()
    {
        var user = CreateUser();
        const string password = "P@ssword1";
        var hash1 = _sut.HashPassword(user, password);
        var hash2 = _sut.HashPassword(user, password);
        Assert.NotEqual(hash1, hash2);
    }
}
