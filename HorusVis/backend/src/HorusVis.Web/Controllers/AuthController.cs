using HorusVis.Business.Contracts;
using HorusVis.Data.Services;
using HorusVis.Web.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace HorusVis.Web.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthenticationService authService, IUnitOfWorkService unitOfWork) : ControllerBase
{
    private readonly IAuthenticationService _authService = authService;
    private readonly IUnitOfWorkService _unitOfWork = unitOfWork;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _authService.LoginAsync(request.UsernameOrEmail, request.Password, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            Response.Cookies.Append("refresh_token", result.RawRefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = result.RefreshTokenExpiresAt,
                Path = "/api/auth",
            });

            return Ok(new LoginResponse(result.AccessToken, result.AccessTokenExpiresAt));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(Problem(detail: ex.Message, statusCode: 401));
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        var rawToken = Request.Cookies["refresh_token"];
        if (string.IsNullOrEmpty(rawToken))
            return Unauthorized(Problem(detail: "No refresh token provided", statusCode: 401));

        try
        {
            var result = await _authService.RefreshAsync(rawToken, ct);
            await _unitOfWork.SaveChangesAsync(ct); // commits: old session revoked + new session created

            Response.Cookies.Append("refresh_token", result.RawRefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = result.RefreshTokenExpiresAt,
                Path = "/api/auth",
            });

            return Ok(new LoginResponse(result.AccessToken, result.AccessTokenExpiresAt));
        }
        catch (UnauthorizedAccessException ex)
        {
            // SaveChangesAsync is NOT called — any uncommitted EF state changes are discarded.
            // The reuse-detection revocations are already committed inside IUserSessionDao.
            Response.Cookies.Delete("refresh_token", new CookieOptions { Path = "/api/auth" });
            return Unauthorized(Problem(detail: ex.Message, statusCode: 401));
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var rawToken = Request.Cookies["refresh_token"];
        if (!string.IsNullOrEmpty(rawToken))
        {
            try
            {
                await _authService.LogoutAsync(rawToken, ct);
                await _unitOfWork.SaveChangesAsync(ct); // commits: session revoked
            }
            catch { /* idempotent — unknown token is not an error */ }
        }

        Response.Cookies.Delete("refresh_token", new CookieOptions { Path = "/api/auth" });
        return NoContent();
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        try
        {
            await _authService.RegisterAsync(request.Username, request.Email, request.FullName, request.Password, ct);
            await _unitOfWork.SaveChangesAsync(ct); // commits: new user added
            return Created();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(Problem(detail: ex.Message, statusCode: 409));
        }
    }
}

