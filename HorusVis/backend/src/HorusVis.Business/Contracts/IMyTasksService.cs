using HorusVis.Data.Horusvis.Entities;

namespace HorusVis.Business.Contracts;

public interface IMyTasksService
{
    Task<(List<WorkTask> TodoTasks, List<WorkTask> WorkingTasks, List<WorkTask> StuckTasks, List<WorkTask> DoneTasks)> GetMyBoardAsync(Guid currentUserId, CancellationToken ct = default);
    Task<WorkTask> CreateTaskAsync(Guid projectId, string title, string? description, string priority, Guid createdByUserId, Guid? featureAreaId = null, decimal? planEstimate = null, DateOnly? startDate = null, DateOnly? dueDate = null, CancellationToken ct = default);
    Task<(WorkTask Task, List<Issue> Issues, List<Subtask> Subtasks)?> GetTaskDetailAsync(Guid taskId, CancellationToken ct = default);
    Task<WorkTask> UpdateTaskAsync(Guid taskId, string title, string? description, string status, string priority, Guid? assigneeUserId = null, string? blockedNote = null, DateOnly? startDate = null, DateOnly? dueDate = null, CancellationToken ct = default);
    Task<List<Subtask>> GetTaskSubtasksAsync(Guid taskId, CancellationToken ct = default);
    Task<List<Issue>> GetTaskIssuesAsync(Guid taskId, CancellationToken ct = default);
    Task RecalculateTaskProgressAsync(Guid taskId, CancellationToken ct = default);
    Task SyncTaskStatusIfBlockedAsync(Guid taskId, CancellationToken ct = default);
}
