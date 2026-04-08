using HorusVis.Web.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/reports")]
public sealed class ReportsController : ControllerBase
{
    [HttpGet("placeholder")]
    public ActionResult<ScaffoldEndpointResponse> GetPlaceholder()
    {
        return Ok(new ScaffoldEndpointResponse("reports", "scaffolded", "Reporting APIs will be implemented here."));
    }
}
