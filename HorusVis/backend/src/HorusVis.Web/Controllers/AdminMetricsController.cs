using HorusVis.Business.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize(Roles = "admin")]
[Route("api/admin")]
public sealed class AdminMetricsController(IAdministrationService adminService) : ControllerBase
{
    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics(CancellationToken ct = default)
    {
        var metrics = await adminService.GetMetricsAsync(ct);
        return Ok(metrics);
    }

    [HttpGet("nodes")]
    public async Task<IActionResult> ListNodes(CancellationToken ct = default)
    {
        var nodes = await adminService.ListNodesAsync(ct);
        return Ok(nodes);
    }
}
