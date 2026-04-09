using HorusVis.Business.Contracts;
using HorusVis.Business.Services;
using HorusVis.Core.Options;
using HorusVis.Data;
using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using HorusVis.Web.Contracts.Issues;
using HorusVis.Web.Contracts.Subtasks;
using HorusVis.Web.Contracts.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/tasks")]
public sealed class TasksController(
    ITasksService tasksService,
    ISubtasksService subtasksService,
    IIssuesService issuesService,
    TaskProgressCalculator progressCalculator,
    TaskDetailQuery taskDetailQuery,
    HorusVisDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Get my board with tasks grouped by status
    /// </summary>
    [HttpGet("my-board")]
    public async Task<ActionResult<MyBoardResponse>> GetMyBoard(CancellationToken ct)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var userIdGuid))
            return Unauthorized();

        var (todoTasks, workingTasks, stuckTasks, doneTasks) = 
            await tasksService.GetMyBoardAsync(userIdGuid, ct);

        var response = new MyBoardResponse(
            todoTasks.ConvertAll(MapToResponse),
            workingTasks.ConvertAll(MapToResponse),
            stuckTasks.ConvertAll(MapToResponse),
            doneTasks.ConvertAll(MapToResponse)
        );

        return Ok(response);
    }

    /// <summary>
    /// Get feature areas for a project
    /// </summary>
    [HttpGet("feature-areas/{projectId}")]
    public async Task<ActionResult<List<FeatureAreaResponse>>> GetFeatureAreas(
        [FromRoute] Guid projectId,
        CancellationToken ct)
    {
        var featureAreas = await dbContext.Set<FeatureArea>()
            .Where(fa => fa.ProjectId == projectId)
            .OrderBy(fa => fa.AreaCode)
            .Select(fa => new FeatureAreaResponse(
                fa.Id,
                fa.AreaCode,
                fa.AreaName,
                fa.ColorHex
            ))
            .ToListAsync(ct);

        return Ok(featureAreas);
    }

    /// <summary>
    /// Create a new task
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TaskResponse>> CreateTask(
        [FromBody] CreateTaskRequest request,
        CancellationToken ct)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var userIdGuid))
            return Unauthorized();

        var task = await tasksService.CreateTaskAsync(
            request.ProjectId,
            request.Title,
            request.Description,
            request.Priority,
            userIdGuid,
            request.FeatureAreaId,
            request.PlanEstimate,
            request.StartDate,
            request.DueDate,
            ct);

        return CreatedAtAction(nameof(GetTaskDetail), new { taskId = task.Id }, MapToResponse(task));
    }

    /// <summary>
    /// Get task details with related issues and subtasks
    /// </summary>
    [HttpGet("{taskId}")]
    public async Task<ActionResult<TaskDetailResponse>> GetTaskDetail(
        [FromRoute] Guid taskId,
        CancellationToken ct)
    {
        var detail = await tasksService.GetTaskDetailAsync(taskId, ct);
        if (detail is null)
            return NotFound();

        var (task, issues, subtasks) = detail.Value;

        FeatureAreaResponse? featureAreaResponse = null;
        if (task.FeatureArea is not null)
        {
            featureAreaResponse = new FeatureAreaResponse(
                task.FeatureArea.Id,
                task.FeatureArea.AreaCode,
                task.FeatureArea.AreaName,
                task.FeatureArea.ColorHex
            );
        }

        var response = new TaskDetailResponse(
            task.Id,
            task.ProjectId,
            task.Title,
            task.Description,
            task.Priority.ToString(),
            task.Status.ToString(),
            task.BlockedNote,
            task.ProgressPercent,
            task.PlanEstimate,
            task.StartDate,
            task.DueDate,
            task.CreatedByUserId,
            task.CreatedAt,
            task.UpdatedAt,
            issues.ConvertAll(i => MapIssueToResponse(i)),
            subtasks.ConvertAll(s => MapSubtaskToResponse(s)),
            featureAreaResponse
        );

        return Ok(response);
    }

    /// <summary>
    /// Update a task
    /// </summary>
    [HttpPut("{taskId}")]
    public async Task<ActionResult<TaskResponse>> UpdateTask(
        [FromRoute] Guid taskId,
        [FromBody] UpdateTaskRequest request,
        CancellationToken ct)
    {
        var task = await tasksService.UpdateTaskAsync(
            taskId,
            request.Title,
            request.Description,
            request.Status,
            request.Priority,
            request.BlockedNote,
            request.StartDate,
            request.DueDate,
            ct);

        return Ok(MapToResponse(task));
    }

    /// <summary>
    /// Get subtasks by task ID
    /// </summary>
    [HttpGet("{taskId}/subtasks")]
    public async Task<ActionResult<List<SubtaskResponse>>> GetTaskSubtasks(
        [FromRoute] Guid taskId,
        CancellationToken ct)
    {
        var subtasks = await tasksService.GetTaskSubtasksAsync(taskId, ct);
        return Ok(subtasks.ConvertAll(MapSubtaskToResponse));
    }

    /// <summary>
    /// Create a subtask for a task
    /// </summary>
    [HttpPost("{taskId}/subtasks")]
    public async Task<ActionResult<SubtaskResponse>> CreateTaskSubtask(
        [FromRoute] Guid taskId,
        [FromBody] CreateSubtaskRequest request,
        CancellationToken ct)
    {
        var subtask = await subtasksService.CreateTaskSubtaskAsync(
            taskId,
            request.Title,
            request.Description,
            request.EstimateHours,
            request.ToDoHours,
            request.OwnerUserId,
            request.DueDate,
            ct);

        return CreatedAtAction(nameof(GetTaskSubtasks), new { taskId = taskId }, MapSubtaskToResponse(subtask));
    }

    /// <summary>
    /// Get issues by task ID
    /// </summary>
    [HttpGet("{taskId}/issues")]
    public async Task<ActionResult<List<IssueResponse>>> GetTaskIssues(
        [FromRoute] Guid taskId,
        CancellationToken ct)
    {
        var issues = await tasksService.GetTaskIssuesAsync(taskId, ct);
        return Ok(issues.ConvertAll(MapIssueToResponse));
    }

    /// <summary>
    /// Create an issue for a task
    /// </summary>
    [HttpPost("{taskId}/issues")]
    public async Task<ActionResult<IssueResponse>> CreateTaskIssue(
        [FromRoute] Guid taskId,
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
            taskId,
            request.DueDate,
            ct);

        return CreatedAtAction("GetIssueDetail", "Issues", new { issueId = issue.Id }, MapIssueToResponse(issue));
    }

    /// <summary>
    /// Get task health status (blocked, overdue, completion)
    /// </summary>
    [HttpGet("{taskId}/health")]
    public async Task<ActionResult<object>> GetTaskHealth(
        [FromRoute] Guid taskId,
        CancellationToken ct)
    {
        var health = await progressCalculator.GetTaskHealthAsync(taskId, ct);
        return Ok(health);
    }

    /// <summary>
    /// Get task effort summary (estimate, todo, actuals)
    /// </summary>
    [HttpGet("{taskId}/effort")]
    public async Task<ActionResult<object>> GetTaskEffortSummary(
        [FromRoute] Guid taskId,
        CancellationToken ct)
    {
        var effortSummary = await progressCalculator.GetTaskEffortSummaryAsync(taskId, ct);
        return Ok(effortSummary);
    }

    /// <summary>
    /// Get task burndown progress data
    /// </summary>
    [HttpGet("{taskId}/burndown")]
    public async Task<ActionResult<object>> GetTaskBurndown(
        [FromRoute] Guid taskId,
        CancellationToken ct)
    {
        var burndown = await taskDetailQuery.GetTaskBurndownAsync(taskId, ct);
        if (burndown is null)
            return NotFound();

        return Ok(burndown);
    }

    /// <summary>
    /// Get task dependencies (blocking issues, pending subtasks)
    /// </summary>
    [HttpGet("{taskId}/dependencies")]
    public async Task<ActionResult<object>> GetTaskDependencies(
        [FromRoute] Guid taskId,
        CancellationToken ct)
    {
        var dependencies = await taskDetailQuery.GetTaskDependenciesAsync(taskId, ct);
        if (dependencies is null)
            return NotFound();

        return Ok(dependencies);
    }

    /// <summary>
    /// Get task resource allocation (assigned owners)
    /// </summary>
    [HttpGet("{taskId}/resources")]
    public async Task<ActionResult<object>> GetTaskResources(
        [FromRoute] Guid taskId,
        CancellationToken ct)
    {
        var resources = await taskDetailQuery.GetTaskResourcesAsync(taskId, ct);
        if (resources is null)
            return NotFound();

        return Ok(resources);
    }

    private static TaskResponse MapToResponse(HorusVis.Data.Horusvis.Entities.WorkTask task)
    {
        FeatureAreaResponse? featureAreaResponse = null;
        if (task.FeatureArea is not null)
        {
            featureAreaResponse = new FeatureAreaResponse(
                task.FeatureArea.Id,
                task.FeatureArea.AreaCode,
                task.FeatureArea.AreaName,
                task.FeatureArea.ColorHex
            );
        }

        return new TaskResponse(
            task.Id,
            task.ProjectId,
            task.Title,
            task.Description,
            task.Priority.ToString(),
            task.Status.ToString(),
            task.BlockedNote,
            task.ProgressPercent,
            task.PlanEstimate,
            task.StartDate,
            task.DueDate,
            task.CreatedByUserId,
            task.CreatedAt,
            task.UpdatedAt,
            featureAreaResponse
        );
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
