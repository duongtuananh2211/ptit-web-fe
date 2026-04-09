using HorusVis.Business.Contracts;
using HorusVis.Data.Horusvis.Entities;
using HorusVis.Web.Contracts.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/my-tasks")]
public sealed class MyTasksController(IMyTasksService myTasksService) : ControllerBase
{
    /// <summary>
    /// Get my board with tasks grouped by status (To Do, Working, Stuck, Done)
    /// </summary>
    [HttpGet("board")]
    public async Task<ActionResult<MyBoardResponse>> GetMyBoard(CancellationToken ct)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var userIdGuid))
            return Unauthorized();

        var (todoTasks, workingTasks, stuckTasks, doneTasks) = 
            await myTasksService.GetMyBoardAsync(userIdGuid, ct);

        var response = new MyBoardResponse(
            todoTasks.ConvertAll(MapToResponse),
            workingTasks.ConvertAll(MapToResponse),
            stuckTasks.ConvertAll(MapToResponse),
            doneTasks.ConvertAll(MapToResponse)
        );

        return Ok(response);
    }

    private static TaskResponse MapToResponse(HorusVis.Data.Horusvis.Entities.WorkTask task) => new(
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
        null
    );
}
