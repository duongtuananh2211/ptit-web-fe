using System.Security.Claims;
using HorusVis.Business.Contracts;
using HorusVis.Business.Models.Projects;
using HorusVis.Business.Models.Sprints;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/projects")]
public sealed class ProjectsController(
    IProjectsService projects,
    IProjectMembersService members,
    IFeatureAreasService featureAreas,
    ISprintsService sprints) : ControllerBase
{
    // ─── Projects CRUD ────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<ActionResult<ProjectListResponse>> GetProjects(
        [FromQuery] ProjectListFilter filter,
        CancellationToken ct)
    {
        var callerId = GetCallerId();
        var result   = await projects.GetProjectsAsync(filter, callerId, ct);
        return Ok(result);
    }

    [HttpGet("{projectId:guid}")]
    public async Task<ActionResult<ProjectDetailResponse>> GetProject(Guid projectId, CancellationToken ct)
    {
        try
        {
            var callerId = GetCallerId();
            var result   = await projects.GetProjectByIdAsync(projectId, callerId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException e) { return NotFound(new { e.Message }); }
    }

    [HttpPost]
    public async Task<ActionResult<ProjectDetailResponse>> CreateProject(
        [FromBody] CreateProjectRequest request,
        CancellationToken ct)
    {
        try
        {
            var callerId = GetCallerId();
            var result   = await projects.CreateProjectAsync(request, callerId, ct);
            return CreatedAtAction(nameof(GetProject), new { projectId = result.Id }, result);
        }
        catch (InvalidOperationException e) { return Conflict(new { e.Message }); }
    }

    [HttpPut("{projectId:guid}")]
    public async Task<ActionResult<ProjectDetailResponse>> UpdateProject(
        Guid projectId,
        [FromBody] UpdateProjectRequest request,
        CancellationToken ct)
    {
        try
        {
            var callerId = GetCallerId();
            var result   = await projects.UpdateProjectAsync(projectId, request, callerId, ct);
            return Ok(result);
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException e)      { return NotFound(new { e.Message }); }
        catch (InvalidOperationException e) { return Conflict(new { e.Message }); }
    }

    [HttpPost("{projectId:guid}/archive")]
    public async Task<IActionResult> ArchiveProject(Guid projectId, CancellationToken ct)
    {
        try
        {
            var callerId = GetCallerId();
            await projects.ArchiveProjectAsync(projectId, callerId, ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException e)      { return NotFound(new { e.Message }); }
    }

    // ─── Members ──────────────────────────────────────────────────────────────

    [HttpGet("{projectId:guid}/members")]
    public async Task<ActionResult<IReadOnlyList<ProjectMemberDto>>> GetMembers(Guid projectId, CancellationToken ct)
    {
        try
        {
            var callerId = GetCallerId();
            var result   = await members.GetMembersAsync(projectId, callerId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException e) { return NotFound(new { e.Message }); }
    }

    [HttpPost("{projectId:guid}/members")]
    public async Task<ActionResult<ProjectMemberDto>> AddMember(
        Guid projectId,
        [FromBody] AddProjectMemberRequest request,
        CancellationToken ct)
    {
        try
        {
            var callerId = GetCallerId();
            var result   = await members.AddMemberAsync(projectId, request, callerId, ct);
            return Created(string.Empty, result);
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException e)      { return NotFound(new { e.Message }); }
        catch (InvalidOperationException e) { return Conflict(new { e.Message }); }
    }

    [HttpPut("{projectId:guid}/members/{memberId:guid}")]
    public async Task<ActionResult<ProjectMemberDto>> UpdateMember(
        Guid projectId,
        Guid memberId,
        [FromBody] UpdateProjectMemberRequest request,
        CancellationToken ct)
    {
        try
        {
            var callerId = GetCallerId();
            var result   = await members.UpdateMemberAsync(projectId, memberId, request, callerId, ct);
            return Ok(result);
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException e)      { return NotFound(new { e.Message }); }
        catch (InvalidOperationException e) { return Conflict(new { e.Message }); }
    }

    [HttpDelete("{projectId:guid}/members/{memberId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid projectId, Guid memberId, CancellationToken ct)
    {
        try
        {
            var callerId = GetCallerId();
            await members.RemoveMemberAsync(projectId, memberId, callerId, ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException e)      { return NotFound(new { e.Message }); }
    }

    // ─── Feature Areas ────────────────────────────────────────────────────────

    [HttpGet("{projectId:guid}/feature-areas")]
    public async Task<ActionResult<IReadOnlyList<FeatureAreaDto>>> GetFeatureAreas(Guid projectId, CancellationToken ct)
    {
        try
        {
            var callerId = GetCallerId();
            var result   = await featureAreas.GetFeatureAreasAsync(projectId, callerId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException e) { return NotFound(new { e.Message }); }
    }

    [HttpPost("{projectId:guid}/feature-areas")]
    public async Task<ActionResult<FeatureAreaDto>> CreateFeatureArea(
        Guid projectId,
        [FromBody] CreateFeatureAreaRequest request,
        CancellationToken ct)
    {
        try
        {
            var callerId = GetCallerId();
            var result   = await featureAreas.CreateFeatureAreaAsync(projectId, request, callerId, ct);
            return Created(string.Empty, result);
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException e)      { return NotFound(new { e.Message }); }
        catch (InvalidOperationException e) { return Conflict(new { e.Message }); }
    }

    [HttpDelete("{projectId:guid}/feature-areas/{areaId:guid}")]
    public async Task<IActionResult> DeleteFeatureArea(Guid projectId, Guid areaId, CancellationToken ct)
    {
        try
        {
            var callerId = GetCallerId();
            await featureAreas.DeleteFeatureAreaAsync(projectId, areaId, callerId, ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException e)      { return NotFound(new { e.Message }); }
    }

    // ─── Overview & Board preview ─────────────────────────────────────────────

    [HttpGet("{projectId:guid}/overview")]
    public async Task<ActionResult<ProjectOverviewDto>> GetProjectOverview(Guid projectId, CancellationToken ct)
    {
        try
        {
            var result = await projects.GetProjectOverviewAsync(projectId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException e) { return NotFound(new { e.Message }); }
    }

    [HttpGet("{projectId:guid}/board-preview")]
    public async Task<ActionResult<ProjectBoardPreviewDto>> GetBoardPreview(Guid projectId, CancellationToken ct)
    {
        try
        {
            var result = await projects.GetBoardPreviewAsync(projectId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException e) { return NotFound(new { e.Message }); }
    }

    // ─── Backlog ──────────────────────────────────────────────────────────────

    [HttpGet("{projectId:guid}/backlog")]
    public async Task<ActionResult<BacklogDto>> GetBacklog(Guid projectId, CancellationToken ct)
    {
        try
        {
            var callerId = GetCallerId();
            var result   = await sprints.GetProjectBacklogAsync(projectId, callerId, ct);
            return Ok(result);
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException e)      { return NotFound(new { e.Message }); }
    }

    /// <summary>
    /// Returns the sprint board for a specific project.
    /// Pass ?sprintId={guid} to view a specific sprint, or omit to use the current sprint.
    /// Returns 204 when no sprint is active and sprintId was not specified.
    /// </summary>
    [HttpGet("{projectId:guid}/board")]
    public async Task<IActionResult> GetProjectBoard(
        Guid projectId,
        [FromQuery] Guid? sprintId,
        CancellationToken ct)
    {
        try
        {
            var callerId = GetCallerId();
            var result   = await sprints.GetProjectSprintBoardAsync(projectId, sprintId, callerId, ct);
            return result is null ? NoContent() : Ok(result);
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
