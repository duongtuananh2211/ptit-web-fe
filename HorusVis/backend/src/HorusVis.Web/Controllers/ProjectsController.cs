using HorusVis.Web.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/projects")]
public sealed class ProjectsController : ControllerBase
{
    [HttpGet("placeholder")]
    public ActionResult<ScaffoldEndpointResponse> GetPlaceholder()
    {
        return Ok(new ScaffoldEndpointResponse("projects", "scaffolded", "Project APIs will be implemented here."));
    }
}
