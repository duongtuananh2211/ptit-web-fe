using HorusVis.Data.Enums;
using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Business.Services;

/// <summary>
/// Query service for fetching detailed task information
/// </summary>
public sealed class TaskDetailQuery(HorusVisDbContext dbContext)
{
    /// <summary>
    /// Get complete task detail with all related data
    /// </summary>
    public async Task<TaskDetailData?> GetTaskDetailCompleteAsync(Guid taskId, CancellationToken ct = default)
    {
        var task = await dbContext.Set<WorkTask>()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == taskId, ct);

        if (task is null)
            return null;

        var subtasks = await dbContext.Set<Subtask>()
            .Where(s => s.TaskId == taskId)
            .AsNoTracking()
            .OrderBy(s => s.SubtaskCode)
            .ToListAsync(ct);

        var issues = await dbContext.Set<Issue>()
            .Where(i => i.TaskId == taskId)
            .AsNoTracking()
            .OrderByDescending(i => i.OpenedAt)
            .ToListAsync(ct);

        var isBlocked = issues.Any(i => i.Status != IssueStatus.Closed && i.Severity == IssueSeverity.Critical);

        var effortSummary = new TaskEffortData(
            TotalEstimateHours: subtasks.Sum(s => s.EstimateHours),
            TotalToDoHours: subtasks.Sum(s => s.ToDoHours),
            TotalActualHours: subtasks.Sum(s => s.ActualHours),
            CompletedSubtasks: subtasks.Count(s => s.State == SubtaskState.Completed),
            TotalSubtasks: subtasks.Count,
            IsBlocked: isBlocked,
            BlockingIssuesCount: issues.Count(i => i.Status != IssueStatus.Closed && i.Severity == IssueSeverity.Critical),
            OpenIssuesCount: issues.Count(i => i.Status != IssueStatus.Closed)
        );

        return new TaskDetailData(
            Task: task,
            Subtasks: subtasks,
            Issues: issues,
            EffortSummary: effortSummary
        );
    }

    /// <summary>
    /// Get task with burndown progress
    /// </summary>
    public async Task<TaskBurndownData?> GetTaskBurndownAsync(Guid taskId, CancellationToken ct = default)
    {
        var task = await dbContext.Set<WorkTask>()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == taskId, ct);

        if (task is null)
            return null;

        var subtasks = await dbContext.Set<Subtask>()
            .Where(s => s.TaskId == taskId)
            .AsNoTracking()
            .ToListAsync(ct);

        decimal totalEstimate = subtasks.Sum(s => s.EstimateHours);
        decimal totalToDo = subtasks.Sum(s => s.ToDoHours);
        decimal totalActual = subtasks.Sum(s => s.ActualHours);

        decimal remainingPercentage = totalEstimate > 0 
            ? (totalToDo / totalEstimate) * 100 
            : 0;

        decimal completionPercentage = totalEstimate > 0 
            ? (totalActual / totalEstimate) * 100 
            : 0;

        return new TaskBurndownData(
            TaskId: task.Id,
            Title: task.Title,
            TotalEstimateHours: totalEstimate,
            TotalActualHours: totalActual,
            RemainingHours: totalToDo,
            CompletionPercentage: Math.Min(completionPercentage, 100),
            RemainingPercentage: Math.Max(remainingPercentage, 0),
            DueDate: task.DueDate,
            StartDate: task.StartDate,
            SubtaskCount: subtasks.Count,
            CurrentStatus: task.Status.ToString()
        );
    }

    /// <summary>
    /// Get task dependency analysis
    /// </summary>
    public async Task<TaskDependencyAnalysis?> GetTaskDependenciesAsync(Guid taskId, CancellationToken ct = default)
    {
        var task = await dbContext.Set<WorkTask>()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == taskId, ct);

        if (task is null)
            return null;

        var blockedByIssues = await dbContext.Set<Issue>()
            .Where(i => i.TaskId == taskId && i.Status != IssueStatus.Closed)
            .AsNoTracking()
            .ToListAsync(ct);

        var dependentSubtasks = await dbContext.Set<Subtask>()
            .Where(s => s.TaskId == taskId && s.State != SubtaskState.Completed)
            .AsNoTracking()
            .ToListAsync(ct);

        return new TaskDependencyAnalysis(
            TaskId: task.Id,
            Title: task.Title,
            BlockedByIssues: blockedByIssues,
            PendingSubtasks: dependentSubtasks,
            IsFullyBlocked: blockedByIssues.Any(i => i.Severity == IssueSeverity.Critical),
            CanProgressToNext: !blockedByIssues.Any(i => i.Severity == IssueSeverity.Critical) && !dependentSubtasks.Any()
        );
    }

    /// <summary>
    /// Get task resource allocation
    /// </summary>
    public async Task<TaskResourceAllocation?> GetTaskResourcesAsync(Guid taskId, CancellationToken ct = default)
    {
        var task = await dbContext.Set<WorkTask>()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == taskId, ct);

        if (task is null)
            return null;

        var subtasks = await dbContext.Set<Subtask>()
            .Where(s => s.TaskId == taskId)
            .Include(s => s.OwnerUser)
            .AsNoTracking()
            .ToListAsync(ct);

        var ownerGroups = subtasks
            .Where(s => s.OwnerUserId.HasValue)
            .GroupBy(s => s.OwnerUserId)
            .Select(g => new ResourceOwner(
                UserId: g.Key.Value,
                OwnerName: g.First().OwnerUser?.FullName ?? "Unknown",
                AssignedSubtasks: g.Count(),
                TotalHours: g.Sum(s => s.EstimateHours)
            ))
            .OrderByDescending(r => r.TotalHours)
            .ToList();

        return new TaskResourceAllocation(
            TaskId: task.Id,
            Title: task.Title,
            ResourceOwners: ownerGroups,
            UnassignedSubtasks: subtasks.Count(s => !s.OwnerUserId.HasValue),
            TotalAssignedHours: ownerGroups.Sum(r => r.TotalHours)
        );
    }
}

/// <summary>
/// Complete task detail data
/// </summary>
public record TaskDetailData(
    WorkTask Task,
    List<Subtask> Subtasks,
    List<Issue> Issues,
    TaskEffortData EffortSummary
);

/// <summary>
/// Task effort breakdown
/// </summary>
public record TaskEffortData(
    decimal TotalEstimateHours,
    decimal TotalToDoHours,
    decimal TotalActualHours,
    int CompletedSubtasks,
    int TotalSubtasks,
    bool IsBlocked,
    int BlockingIssuesCount,
    int OpenIssuesCount
);

/// <summary>
/// Task burndown tracking data
/// </summary>
public record TaskBurndownData(
    Guid TaskId,
    string Title,
    decimal TotalEstimateHours,
    decimal TotalActualHours,
    decimal RemainingHours,
    decimal CompletionPercentage,
    decimal RemainingPercentage,
    DateOnly? DueDate,
    DateOnly? StartDate,
    int SubtaskCount,
    string CurrentStatus
);

/// <summary>
/// Task dependency analysis
/// </summary>
public record TaskDependencyAnalysis(
    Guid TaskId,
    string Title,
    List<Issue> BlockedByIssues,
    List<Subtask> PendingSubtasks,
    bool IsFullyBlocked,
    bool CanProgressToNext
);

/// <summary>
/// Task resource allocation
/// </summary>
public record TaskResourceAllocation(
    Guid TaskId,
    string Title,
    List<ResourceOwner> ResourceOwners,
    int UnassignedSubtasks,
    decimal TotalAssignedHours
);

/// <summary>
/// Resource owner information
/// </summary>
public record ResourceOwner(
    Guid UserId,
    string OwnerName,
    int AssignedSubtasks,
    decimal TotalHours
);
