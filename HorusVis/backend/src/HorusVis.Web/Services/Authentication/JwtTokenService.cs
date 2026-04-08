using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HorusVis.Web.Contracts;
using HorusVis.Web.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace HorusVis.Web.Services.Authentication;

public sealed class JwtTokenService(
    IOptions<JwtAuthenticationOptions> jwtOptionsAccessor,
    TimeProvider timeProvider) : IJwtTokenService
{
    private readonly JwtAuthenticationOptions _jwtOptions = jwtOptionsAccessor.Value;
    private readonly TimeProvider _timeProvider = timeProvider;

    public ScaffoldLoginResponse CreateToken(ScaffoldLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName))
        {
            throw new InvalidOperationException("UserName is required to create a scaffold token.");
        }

        if (string.IsNullOrWhiteSpace(_jwtOptions.SigningKey) || _jwtOptions.SigningKey.Length < 32)
        {
            throw new InvalidOperationException(
                "Authentication:Jwt:SigningKey must be configured with at least 32 characters.");
        }

        var userId = string.IsNullOrWhiteSpace(request.UserId)
            ? Guid.NewGuid().ToString("N")
            : request.UserId;
        var roles = (request.Roles ?? ["User"])
            .Where(role => !string.IsNullOrWhiteSpace(role))
            .Select(role => role.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var now = _timeProvider.GetUtcNow();
        var expiresAt = now.Add(TimeSpan.FromMinutes(_jwtOptions.TokenLifetimeMinutes));

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Name, request.UserName.Trim()),
        };

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            claims.Add(new Claim(ClaimTypes.Email, request.Email.Trim()));
        }

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SigningKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        var serializedToken = new JwtSecurityTokenHandler().WriteToken(token);

        return new ScaffoldLoginResponse(
            serializedToken,
            expiresAt,
            "Bearer",
            userId,
            request.UserName.Trim(),
            roles);
    }
}
