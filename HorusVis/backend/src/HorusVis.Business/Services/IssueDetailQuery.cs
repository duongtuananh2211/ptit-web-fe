using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Business.Services;

/// <summary>
/// Query service for fetching detailed issue information
/// </summary>
public sealed class IssueDetailQuery(HorusVisDbContext dbContext)
{
    /// <summary>
    /// Get complete issue detail with subtasks and activity log
    /// </summary>
    public async Task<IssueDetailData?> GetIssueDetailCompleteAsync(Guid issueId, CancellationToken ct = default)
    {
        var issue = await dbContext.Set<Issue>()
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == issueId, ct);

        if (issue is null)
            return null;

        var subtasks = await dbContext.Set<Subtask>()
            .Where(s => s.IssueId == issueId)
            .AsNoTracking()
            .OrderBy(s => s.SubtaskCode)
            .ToListAsync(ct);

        // Note: IssueActivity table may not exist yet, placeholder for future implementation
        var activities = await dbContext.Set<IssueActivity>()
            .Where(a => a.IssueId == issueId)
            .AsNoTracking()
            .OrderByDescending(a => a.ChangedAt)
            .Take(50) // Limit to recent activities
            .ToListAsync(ct);

        var effortSummary = new IssueEffortSummary(
            TotalEstimateHours: subtasks.Sum(s => s.EstimateHours),
            TotalToDoHours: subtasks.Sum(s => s.ToDoHours),
            TotalActualHours: subtasks.Sum(s => s.ActualHours),
            CompletedSubtasks: subtasks.Count(s => s.State.ToString() == "Completed"),
            TotalSubtasks: subtasks.Count
        );

        return new IssueDetailData(
            Issue: issue,
            Subtasks: subtasks,
            Activities: activities,
            EffortSummary: effortSummary
        );
    }

    /// <summary>
    /// Get issue with workflow metadata
    /// </summary>
    public async Task<IssueWithWorkflow?> GetIssueWithWorkflowAsync(Guid issueId, CancellationToken ct = default)
    {
        var issue = await dbContext.Set<Issue>()
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == issueId, ct);

        if (issue is null)
            return null;

        // Get workflow progression timeline
        var activities = await dbContext.Set<IssueActivity>()
            .Where(a => a.IssueId == issueId)
            .AsNoTracking()
            .OrderBy(a => a.ChangedAt)
            .ToListAsync(ct);

        return new IssueWithWorkflow(
            Issue: issue,
            CurrentStage: issue.WorkflowStage.ToString(),
            Activities: activities,
            TimeInCurrentStage: issue.OpenedAt
        );
    }

    /// <summary>
    /// Get statistics for issue status tracking
    /// </summary>
    public async Task<IssueStatistics> GetIssueStatisticsAsync(Guid projectId, CancellationToken ct = default)
    {
        var issues = await dbContext.Set<Issue>()
            .Where(i => i.ProjectId == projectId)
            .AsNoTracking()
            .ToListAsync(ct);

        return new IssueStatistics(
            TotalIssues: issues.Count,
            OpenIssues: issues.Count(i => i.Status.ToString() == "Open"),
            ResolvedIssues: issues.Count(i => i.Status.ToString() == "Resolved"),
            ClosedIssues: issues.Count(i => i.Status.ToString() == "Closed"),
            CriticalIssues: issues.Count(i => i.Severity.ToString() == "Critical"),
            HighPriorityIssues: issues.Count(i => i.Priority.ToString() == "High"),
            AverageDaysToResolve: issues
                .Where(i => i.ResolvedAt.HasValue)
                .Select(i => (i.ResolvedAt.Value - i.OpenedAt).TotalDays)
                .DefaultIfEmpty(0)
                .Average()
        );
    }
}

/// <summary>
/// Complete issue detail data
/// </summary>
public record IssueDetailData(
    Issue Issue,
    List<Subtask> Subtasks,
    List<IssueActivity> Activities,
    IssueEffortSummary EffortSummary
);

/// <summary>
/// Issue effort tracking summary
/// </summary>
public record IssueEffortSummary(
    decimal TotalEstimateHours,
    decimal TotalToDoHours,
    decimal TotalActualHours,
    int CompletedSubtasks,
    int TotalSubtasks
);

/// <summary>
/// Issue with workflow information
/// </summary>
public record IssueWithWorkflow(
    Issue Issue,
    string CurrentStage,
    List<IssueActivity> Activities,
    DateTimeOffset TimeInCurrentStage
);

/// <summary>
/// Issue statistics for project
/// </summary>
public record IssueStatistics(
    int TotalIssues,
    int OpenIssues,
    int ResolvedIssues,
    int ClosedIssues,
    int CriticalIssues,
    int HighPriorityIssues,
    double AverageDaysToResolve
);
