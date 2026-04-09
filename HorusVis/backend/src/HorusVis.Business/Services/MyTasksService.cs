using HorusVis.Business.Contracts;
using HorusVis.Data.Horusvis.Entities;

namespace HorusVis.Business.Services;

public sealed class MyTasksService(ITasksService tasksService) : IMyTasksService
{
    public async Task<(List<WorkTask> TodoTasks, List<WorkTask> WorkingTasks, List<WorkTask> StuckTasks, List<WorkTask> DoneTasks)> GetMyBoardAsync(Guid currentUserId, CancellationToken ct = default)
    {
        return await tasksService.GetMyBoardAsync(currentUserId, ct);
    }

    public async Task<WorkTask> CreateTaskAsync(Guid projectId, string title, string? description, string priority, Guid createdByUserId, Guid? featureAreaId = null, decimal? planEstimate = null, DateOnly? startDate = null, DateOnly? dueDate = null, CancellationToken ct = default)
    {
        return await tasksService.CreateTaskAsync(projectId, title, description, priority, createdByUserId, featureAreaId, planEstimate, startDate, dueDate, ct);
    }

    public async Task<(WorkTask Task, List<Issue> Issues, List<Subtask> Subtasks)?> GetTaskDetailAsync(Guid taskId, CancellationToken ct = default)
    {
        return await tasksService.GetTaskDetailAsync(taskId, ct);
    }

    public async Task<WorkTask> UpdateTaskAsync(Guid taskId, string title, string? description, string status, string priority, string? blockedNote = null, DateOnly? startDate = null, DateOnly? dueDate = null, CancellationToken ct = default)
    {
        return await tasksService.UpdateTaskAsync(taskId, title, description, status, priority, blockedNote, startDate, dueDate, ct);
    }

    public async Task<List<Subtask>> GetTaskSubtasksAsync(Guid taskId, CancellationToken ct = default)
    {
        return await tasksService.GetTaskSubtasksAsync(taskId, ct);
    }

    public async Task<List<Issue>> GetTaskIssuesAsync(Guid taskId, CancellationToken ct = default)
    {
        return await tasksService.GetTaskIssuesAsync(taskId, ct);
    }

    public async Task RecalculateTaskProgressAsync(Guid taskId, CancellationToken ct = default)
    {
        await tasksService.RecalculateTaskProgressAsync(taskId, ct);
    }

    public async Task SyncTaskStatusIfBlockedAsync(Guid taskId, CancellationToken ct = default)
    {
        await tasksService.SyncTaskStatusIfBlockedAsync(taskId, ct);
    }
}
