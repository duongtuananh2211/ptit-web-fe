using HorusVis.Business.Models.Sprints;

namespace HorusVis.Business.Contracts;

public interface ISprintsService
{
    // ─── Phase 1: Read queries ─────────────────────────────────────────────

    Task<IReadOnlyList<SprintDto>> GetAllSprintsAsync(CancellationToken ct = default);
    Task<SprintDto?>               GetCurrentSprintAsync(CancellationToken ct = default);
    Task<SprintDto>                GetSprintByIdAsync(Guid sprintId, CancellationToken ct = default);
    Task<SprintDto>                GetSprintByCodeAsync(string sprintCode, CancellationToken ct = default);
    Task<SprintBoardDto>           GetSprintBoardAsync(Guid sprintId, CancellationToken ct = default);
    Task<BacklogDto>               GetProjectBacklogAsync(Guid projectId, Guid callerId, CancellationToken ct = default);

    /// <summary>
    /// Returns the sprint board scoped to a single project.
    /// When sprintId is null, resolves to the current sprint (today between StartDate/EndDate).
    /// Returns null SprintBoardDto.Sprint when no sprint is active and sprintId is null.
    /// Throws KeyNotFoundException if a specific sprintId is provided but not found.
    /// </summary>
    Task<SprintBoardDto?> GetProjectSprintBoardAsync(Guid projectId, Guid? sprintId, Guid callerId, CancellationToken ct = default);

    // ─── Phase 2: Sprint item assignment ──────────────────────────────────

    Task AssignTaskToSprintAsync(Guid sprintId, Guid taskId, Guid callerId, CancellationToken ct = default);
    Task UnassignTaskFromSprintAsync(Guid taskId, Guid callerId, CancellationToken ct = default);
    Task AssignIssueToSprintAsync(Guid sprintId, Guid issueId, Guid callerId, CancellationToken ct = default);
    Task UnassignIssueFromSprintAsync(Guid issueId, Guid callerId, CancellationToken ct = default);
}
