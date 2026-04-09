using HorusVis.Business.Contracts;
using HorusVis.Web.Contracts.Subtasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/subtasks")]
public sealed class SubtasksController(ISubtasksService subtasksService) : ControllerBase
{
    /// <summary>
    /// Update a subtask
    /// </summary>
    [HttpPut("{subtaskId}")]
    public async Task<ActionResult<SubtaskResponse>> UpdateSubtask(
        [FromRoute] Guid subtaskId,
        [FromBody] UpdateSubtaskRequest request,
        CancellationToken ct)
    {
        var subtask = await subtasksService.UpdateSubtaskAsync(
            subtaskId,
            request.Title,
            request.Description,
            request.State,
            request.EstimateHours,
            request.ToDoHours,
            request.ActualHours,
            request.OwnerUserId,
            request.DueDate,
            ct);

        return Ok(MapSubtaskToResponse(subtask));
    }

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
