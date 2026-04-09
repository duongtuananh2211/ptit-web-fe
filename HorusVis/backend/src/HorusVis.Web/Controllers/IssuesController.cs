using HorusVis.Business.Contracts;
using HorusVis.Web.Contracts.Issues;
using HorusVis.Web.Contracts.Subtasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/issues")]
public sealed class IssuesController(IIssuesService issuesService, ISubtasksService subtasksService) : ControllerBase
{
    /// <summary>
    /// Create a new issue (optionally attached to a task)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<IssueResponse>> CreateIssue(
        [FromBody] CreateIssueRequest request,
        CancellationToken ct)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var userIdGuid))
            return Unauthorized();

        var issue = await issuesService.CreateIssueAsync(
            request.ProjectId,
            request.Title,
            request.Summary,
            request.Severity,
            request.Priority,
            userIdGuid,
            request.TaskId,
            request.DueDate,
            ct);

        return CreatedAtAction(nameof(GetIssueDetail), new { issueId = issue.Id }, MapIssueToResponse(issue));
    }

    /// <summary>
    /// Get issue details with related subtasks
    /// </summary>
    [HttpGet("{issueId}")]
    public async Task<ActionResult<IssueDetailResponse>> GetIssueDetail(
        [FromRoute] Guid issueId,
        CancellationToken ct)
    {
        var detail = await issuesService.GetIssueDetailAsync(issueId, ct);
        if (detail is null)
            return NotFound();

        var (issue, subtasks) = detail.Value;

        var response = new IssueDetailResponse(
            issue.Id,
            issue.ProjectId,
            issue.IssueCode,
            issue.Title,
            issue.Summary,
            issue.Severity.ToString(),
            issue.Priority.ToString(),
            issue.Status.ToString(),
            issue.WorkflowStage.ToString(),
            issue.ReporterUserId,
            issue.CurrentAssigneeUserId,
            issue.VerifiedByUserId,
            issue.DueDate,
            issue.OpenedAt,
            issue.ResolvedAt,
            issue.ClosedAt,
            subtasks.ConvertAll(MapSubtaskToResponse),
            issue.TaskId
        );

        return Ok(response);
    }

    /// <summary>
    /// Update an issue
    /// </summary>
    [HttpPut("{issueId}")]
    public async Task<ActionResult<IssueResponse>> UpdateIssue(
        [FromRoute] Guid issueId,
        [FromBody] UpdateIssueRequest request,
        CancellationToken ct)
    {
        var issue = await issuesService.UpdateIssueAsync(
            issueId,
            request.Title,
            request.Summary,
            request.Status,
            request.Severity,
            request.Priority,
            request.WorkflowStage,
            request.CurrentAssigneeUserId,
            request.VerifiedByUserId,
            request.DueDate,
            ct);

        return Ok(MapIssueToResponse(issue));
    }

    /// <summary>
    /// Get subtasks by issue ID
    /// </summary>
    [HttpGet("{issueId}/subtasks")]
    public async Task<ActionResult<List<SubtaskResponse>>> GetIssueSubtasks(
        [FromRoute] Guid issueId,
        CancellationToken ct)
    {
        var subtasks = await issuesService.GetIssueSubtasksAsync(issueId, ct);
        return Ok(subtasks.ConvertAll(MapSubtaskToResponse));
    }

    /// <summary>
    /// Create a subtask for an issue
    /// </summary>
    [HttpPost("{issueId}/subtasks")]
    public async Task<ActionResult<SubtaskResponse>> CreateIssueSubtask(
        [FromRoute] Guid issueId,
        [FromBody] CreateSubtaskRequest request,
        CancellationToken ct)
    {
        var subtask = await subtasksService.CreateIssueSubtaskAsync(
            issueId,
            request.Title,
            request.Description,
            request.EstimateHours,
            request.ToDoHours,
            request.OwnerUserId,
            request.DueDate,
            ct);

        return CreatedAtAction(nameof(GetIssueSubtasks), new { issueId = issueId }, MapSubtaskToResponse(subtask));
    }

    private static IssueResponse MapIssueToResponse(HorusVis.Data.Horusvis.Entities.Issue issue) => new(
        issue.Id,
        issue.ProjectId,
        issue.IssueCode,
        issue.Title,
        issue.Summary,
        issue.Severity.ToString(),
        issue.Priority.ToString(),
        issue.Status.ToString(),
        issue.WorkflowStage.ToString(),
        issue.ReporterUserId,
        issue.CurrentAssigneeUserId,
        issue.VerifiedByUserId,
        issue.DueDate,
        issue.OpenedAt,
        issue.ResolvedAt,
        issue.ClosedAt,
        issue.TaskId
    );

    private static SubtaskResponse MapSubtaskToResponse(HorusVis.Data.Horusvis.Entities.Subtask subtask) => new(
        subtask.Id,
        subtask.SubtaskCode,
        subtask.Title,
        subtask.Description,
        subtask.State.ToString(),
        subtask.OwnerUserId,
        subtask.EstimateHours,
        subtask.ToDoHours,
        subtask.ActualHours,
        subtask.DueDate,
        subtask.CreatedAt,
        subtask.UpdatedAt,
        subtask.TaskId,
        subtask.IssueId
    );
}
