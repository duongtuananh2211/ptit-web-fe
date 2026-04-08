using HorusVis.Web.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/my-tasks")]
public sealed class MyTasksController : ControllerBase
{
    [HttpGet("placeholder")]
    public ActionResult<ScaffoldEndpointResponse> GetPlaceholder()
    {
        return Ok(new ScaffoldEndpointResponse("my-tasks", "scaffolded", "Task APIs will be implemented here."));
    }
}
