using System.Security.Claims;
using HorusVis.Web.Contracts;
using HorusVis.Web.Services.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HorusVis.Web.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IJwtTokenService jwtTokenService) : ControllerBase
{
    private readonly IJwtTokenService _jwtTokenService = jwtTokenService;

    [AllowAnonymous]
    [HttpPost("login")]
    public ActionResult<ScaffoldLoginResponse> Login([FromBody] ScaffoldLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName))
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                [nameof(request.UserName)] = ["UserName is required."],
            }));
        }

        return Ok(_jwtTokenService.CreateToken(request));
    }

    [Authorize]
    [HttpGet("me")]
    public ActionResult<AuthenticatedUserResponse> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var userName = User.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
        var email = User.FindFirstValue(ClaimTypes.Email);
        var roles = User.FindAll(ClaimTypes.Role)
            .Select(claim => claim.Value)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return Ok(new AuthenticatedUserResponse(userId, userName, email, roles));
    }

    [AllowAnonymous]
    [HttpGet("placeholder")]
    public ActionResult<ScaffoldEndpointResponse> GetPlaceholder()
    {
        return Ok(new ScaffoldEndpointResponse("auth", "scaffolded", "Use POST /api/auth/login to get a local development bearer token."));
    }
}
