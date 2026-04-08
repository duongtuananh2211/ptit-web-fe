using HorusVis.Business.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize(Roles = "admin")]
[Route("api/deployments")]
public sealed class DeploymentsController(IAdministrationService adminService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> ListDeployments(
        [FromQuery] int take = 10,
        CancellationToken ct = default)
    {
        if (take is < 1 or > 50) take = 10;
        var deployments = await adminService.ListDeploymentsAsync(take, ct);
        return Ok(deployments);
    }
}
