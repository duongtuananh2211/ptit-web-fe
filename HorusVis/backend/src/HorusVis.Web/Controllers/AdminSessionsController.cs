using HorusVis.Business.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize(Roles = "admin")]
[Route("api/admin/sessions")]
public sealed class AdminSessionsController(
    IAdministrationService adminService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> ListSessions(CancellationToken ct = default)
    {
        var sessions = await adminService.ListSessionsAsync(ct);
        return Ok(sessions);
    }

    [HttpDelete("{sessionId:guid}")]
    public async Task<IActionResult> RevokeSession(
        Guid sessionId,
        CancellationToken ct = default)
    {
        await adminService.RevokeSessionAsync(sessionId, ct);
        // RevokeByIdAsync commits immediately — no extra SaveChanges needed
        return NoContent();
    }
}
