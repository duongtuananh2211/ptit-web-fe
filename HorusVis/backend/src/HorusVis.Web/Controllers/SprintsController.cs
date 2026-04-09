using System.Security.Claims;
using HorusVis.Business.Contracts;
using HorusVis.Business.Models.Sprints;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/sprints")]
public sealed class SprintsController(ISprintsService sprints) : ControllerBase
{
    // ─── Read queries ─────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SprintDto>>> GetAllSprints(CancellationToken ct)
    {
        var result = await sprints.GetAllSprintsAsync(ct);
        return Ok(result);
    }

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentSprint(CancellationToken ct)
    {
        var result = await sprints.GetCurrentSprintAsync(ct);
        return result is null ? NoContent() : Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SprintDto>> GetSprintById(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await sprints.GetSprintByIdAsync(id, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException e) { return NotFound(new { e.Message }); }
    }

    [HttpGet("by-code/{code}")]
    public async Task<ActionResult<SprintDto>> GetSprintByCode(string code, CancellationToken ct)
    {
        try
        {
            var result = await sprints.GetSprintByCodeAsync(code, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException e) { return NotFound(new { e.Message }); }
    }

    [HttpGet("{id:guid}/board")]
    public async Task<ActionResult<SprintBoardDto>> GetSprintBoard(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await sprints.GetSprintBoardAsync(id, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException e) { return NotFound(new { e.Message }); }
    }

    // ─── Sprint item assignment ───────────────────────────────────────────────

    [HttpPost("{id:guid}/tasks/{taskId:guid}")]
    public async Task<IActionResult> AssignTask(Guid id, Guid taskId, CancellationToken ct)
    {
        try
        {
            await sprints.AssignTaskToSprintAsync(id, taskId, GetCallerId(), ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException e)      { return NotFound(new { e.Message }); }
    }

    [HttpDelete("tasks/{taskId:guid}")]
    public async Task<IActionResult> UnassignTask(Guid taskId, CancellationToken ct)
    {
        try
        {
            await sprints.UnassignTaskFromSprintAsync(taskId, GetCallerId(), ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException e)      { return NotFound(new { e.Message }); }
    }

    [HttpPost("{id:guid}/issues/{issueId:guid}")]
    public async Task<IActionResult> AssignIssue(Guid id, Guid issueId, CancellationToken ct)
    {
        try
        {
            await sprints.AssignIssueToSprintAsync(id, issueId, GetCallerId(), ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException e)      { return NotFound(new { e.Message }); }
    }

    [HttpDelete("issues/{issueId:guid}")]
    public async Task<IActionResult> UnassignIssue(Guid issueId, CancellationToken ct)
    {
        try
        {
            await sprints.UnassignIssueFromSprintAsync(issueId, GetCallerId(), ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException e)      { return NotFound(new { e.Message }); }
    }

    // ─── helper ───────────────────────────────────────────────────────────────

    private Guid GetCallerId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("Caller identity not found.");
        return Guid.Parse(value);
    }
}
