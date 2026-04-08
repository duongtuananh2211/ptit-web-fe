using HorusVis.Web.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize(Roles = "admin")]
[Route("api/admin")]
public sealed class AdminController : ControllerBase
{
    [HttpGet("placeholder")]
    public ActionResult<ScaffoldEndpointResponse> GetPlaceholder()
    {
        return Ok(new ScaffoldEndpointResponse("admin", "scaffolded", "Administration APIs will be implemented here."));
    }
}
