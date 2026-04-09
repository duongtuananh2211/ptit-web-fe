using HorusVis.Data.Horusvis.Entities;

namespace HorusVis.Business.Contracts;

public interface ISubtasksService
{
    /// <summary>
    /// Create a subtask for a task
    /// </summary>
    Task<Subtask> CreateTaskSubtaskAsync(Guid taskId, string title, string? description, decimal estimateHours, decimal toDoHours, Guid? ownerUserId = null, DateOnly? dueDate = null, CancellationToken ct = default);

    /// <summary>
    /// Create a subtask for an issue
    /// </summary>
    Task<Subtask> CreateIssueSubtaskAsync(Guid issueId, string title, string? description, decimal estimateHours, decimal toDoHours, Guid? ownerUserId = null, DateOnly? dueDate = null, CancellationToken ct = default);

    /// <summary>
    /// Update subtask and recalculate parent (task/issue) progress
    /// </summary>
    Task<Subtask> UpdateSubtaskAsync(Guid subtaskId, string title, string? description, string state, decimal estimateHours, decimal toDoHours, decimal actualHours, Guid? ownerUserId = null, DateOnly? dueDate = null, CancellationToken ct = default);

    /// <summary>
    /// Get next available subtask code
    /// </summary>
    Task<string> GetNextSubtaskCodeAsync(CancellationToken ct = default);
}
