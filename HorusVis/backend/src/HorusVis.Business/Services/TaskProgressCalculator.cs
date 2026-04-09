using HorusVis.Data.Enums;
using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Business.Services;

/// <summary>
/// Utility service for calculating task progress and related metrics
/// </summary>
public sealed class TaskProgressCalculator(HorusVisDbContext dbContext)
{
    /// <summary>
    /// Calculate progress percent based on subtask efforts
    /// Formula: MIN(100%, SUM(ActualHours) / SUM(EstimateHours) * 100)
    /// </summary>
    public async Task<decimal?> CalculateProgressPercentAsync(Guid taskId, CancellationToken ct = default)
    {
        var subtasks = await dbContext.Set<Subtask>()
            .Where(s => s.TaskId == taskId)
            .Select(s => new { s.EstimateHours, s.ActualHours })
            .ToListAsync(ct);

        if (subtasks.Count == 0)
            return 0;

        decimal totalEstimate = subtasks.Sum(s => s.EstimateHours);
        if (totalEstimate == 0)
            return 0;

        decimal actualHours = subtasks.Sum(s => s.ActualHours);
        decimal progress = (actualHours / totalEstimate) * 100;
        return Math.Min(progress, 100);
    }

    /// <summary>
    /// Get effort summary for a task
    /// </summary>
    public async Task<TaskEffortSummary> GetTaskEffortSummaryAsync(Guid taskId, CancellationToken ct = default)
    {
        var subtasks = await dbContext.Set<Subtask>()
            .Where(s => s.TaskId == taskId)
            .ToListAsync(ct);

        return new TaskEffortSummary(
            TotalEstimateHours: subtasks.Sum(s => s.EstimateHours),
            TotalToDoHours: subtasks.Sum(s => s.ToDoHours),
            TotalActualHours: subtasks.Sum(s => s.ActualHours),
            CompletedSubtasks: subtasks.Count(s => s.State == SubtaskState.Completed),
            TotalSubtasks: subtasks.Count,
            RemainingHours: subtasks.Sum(s => s.ToDoHours)
        );
    }

    /// <summary>
    /// Check if task is blocked (has critical open issues)
    /// </summary>
    public async Task<bool> IsTaskBlockedAsync(Guid taskId, CancellationToken ct = default)
    {
        return await dbContext.Set<Issue>()
            .AnyAsync(i => i.TaskId == taskId
                && i.Status != IssueStatus.Closed
                && i.Severity == IssueSeverity.Critical, ct);
    }

    /// <summary>
    /// Get blocking issues for a task
    /// </summary>
    public async Task<List<Issue>> GetBlockingIssuesAsync(Guid taskId, CancellationToken ct = default)
    {
        return await dbContext.Set<Issue>()
            .Where(i => i.TaskId == taskId
                && i.Status != IssueStatus.Closed
                && i.Severity == IssueSeverity.Critical)
            .AsNoTracking()
            .OrderByDescending(i => i.OpenedAt)
            .ToListAsync(ct);
    }

    /// <summary>
    /// Get task health status
    /// </summary>
    public async Task<TaskHealthStatus> GetTaskHealthAsync(Guid taskId, CancellationToken ct = default)
    {
        var task = await dbContext.Set<WorkTask>()
            .FirstOrDefaultAsync(t => t.Id == taskId, ct);

        if (task is null)
            throw new InvalidOperationException("Task not found");

        var isBlocked = await IsTaskBlockedAsync(taskId, ct);
        var effortSummary = await GetTaskEffortSummaryAsync(taskId, ct);
        var hasOverdue = task.DueDate.HasValue && DateOnly.FromDateTime(DateTime.UtcNow) > task.DueDate.Value;

        var status = TaskHealthEnum.Healthy;
        if (isBlocked)
            status = TaskHealthEnum.Blocked;
        else if (hasOverdue)
            status = TaskHealthEnum.Overdue;
        else if (effortSummary.RemainingHours > 0 && task.Status == WorkTaskStatus.Done)
            status = TaskHealthEnum.Warning;

        return new TaskHealthStatus(
            Status: status,
            IsBlocked: isBlocked,
            HasOverdue: hasOverdue,
            RemainingHours: effortSummary.RemainingHours,
            CompletionPercent: task.ProgressPercent ?? 0,
            DaysUntilDue: task.DueDate.HasValue 
                ? (task.DueDate.Value.ToDateTime(TimeOnly.MinValue) - DateTime.UtcNow).Days 
                : null
        );
    }
}

/// <summary>
/// Task effort tracking summary
/// </summary>
public record TaskEffortSummary(
    decimal TotalEstimateHours,
    decimal TotalToDoHours,
    decimal TotalActualHours,
    int CompletedSubtasks,
    int TotalSubtasks,
    decimal RemainingHours
);

/// <summary>
/// Task health status
/// </summary>
public record TaskHealthStatus(
    TaskHealthEnum Status,
    bool IsBlocked,
    bool HasOverdue,
    decimal RemainingHours,
    decimal CompletionPercent,
    int? DaysUntilDue
);

public enum TaskHealthEnum
{
    Healthy,
    Warning,
    Overdue,
    Blocked
}
