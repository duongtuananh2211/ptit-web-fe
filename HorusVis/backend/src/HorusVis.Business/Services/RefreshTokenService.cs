using System.Security.Cryptography;
using HorusVis.Business.Contracts;

namespace HorusVis.Business.Services;

public sealed class RefreshTokenService : IRefreshTokenService
{
    public string GenerateRawToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    public string HashToken(string rawToken)
    {
        var bytes = Convert.FromBase64String(rawToken);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
