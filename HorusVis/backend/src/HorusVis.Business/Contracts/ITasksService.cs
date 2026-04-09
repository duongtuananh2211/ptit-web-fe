using HorusVis.Data.Horusvis.Entities;

namespace HorusVis.Business.Contracts;

public interface ITasksService
{
    /// <summary>
    /// Get my board with tasks grouped by status (To Do, Working, Stuck, Done)
    /// </summary>
    Task<(List<WorkTask> TodoTasks, List<WorkTask> WorkingTasks, List<WorkTask> StuckTasks, List<WorkTask> DoneTasks)> GetMyBoardAsync(Guid currentUserId, CancellationToken ct = default);

    /// <summary>
    /// Create a new task
    /// </summary>
    Task<WorkTask> CreateTaskAsync(Guid projectId, string title, string? description, string priority, Guid createdByUserId, Guid? featureAreaId = null, decimal? planEstimate = null, DateOnly? startDate = null, DateOnly? dueDate = null, CancellationToken ct = default);

    /// <summary>
    /// Get task details with related issues and subtasks
    /// </summary>
    Task<(WorkTask Task, List<Issue> Issues, List<Subtask> Subtasks)?> GetTaskDetailAsync(Guid taskId, CancellationToken ct = default);

    /// <summary>
    /// Update task
    /// </summary>
    Task<WorkTask> UpdateTaskAsync(Guid taskId, string title, string? description, string status, string priority, string? blockedNote = null, DateOnly? startDate = null, DateOnly? dueDate = null, CancellationToken ct = default);

    /// <summary>
    /// Get subtasks by task ID
    /// </summary>
    Task<List<Subtask>> GetTaskSubtasksAsync(Guid taskId, CancellationToken ct = default);

    /// <summary>
    /// Get issues by task ID
    /// </summary>
    Task<List<Issue>> GetTaskIssuesAsync(Guid taskId, CancellationToken ct = default);

    /// <summary>
    /// Recalculate task progress based on subtasks effort
    /// </summary>
    Task RecalculateTaskProgressAsync(Guid taskId, CancellationToken ct = default);

    /// <summary>
    /// Sync task status to Stuck if blocked by critical/open issue
    /// </summary>
    Task SyncTaskStatusIfBlockedAsync(Guid taskId, CancellationToken ct = default);
}
