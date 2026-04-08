using HorusVis.Business.Contracts;
using HorusVis.Data.Horusvis.Entities;
using Microsoft.AspNetCore.Identity;

namespace HorusVis.Business.Services;

public class PasswordService : IPasswordService
{
    private readonly IPasswordHasher<User> _hasher;

    public PasswordService(IPasswordHasher<User> hasher)
    {
        _hasher = hasher;
    }

    public string HashPassword(User user, string plainPassword)
        => _hasher.HashPassword(user, plainPassword);

    public bool VerifyPassword(User user, string hashedPassword, string providedPassword)
    {
        var result = _hasher.VerifyHashedPassword(user, hashedPassword, providedPassword);
        return result is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
    }
}
