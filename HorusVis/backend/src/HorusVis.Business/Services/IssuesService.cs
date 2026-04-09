using HorusVis.Business.Contracts;
using HorusVis.Data.Enums;
using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Business.Services;

public sealed class IssuesService(HorusVisDbContext dbContext) : IIssuesService
{
    public async Task<Issue> CreateIssueAsync(
        Guid projectId,
        string title,
        string summary,
        string severity,
        string priority,
        Guid reporterUserId,
        Guid? taskId = null,
        DateOnly? dueDate = null,
        CancellationToken ct = default)
    {
        if (!Enum.TryParse<IssueSeverity>(severity, true, out var severityEnum))
            throw new InvalidOperationException($"Invalid severity: {severity}");

        if (!Enum.TryParse<WorkTaskPriority>(priority, true, out var priorityEnum))
            throw new InvalidOperationException($"Invalid priority: {priority}");

        var issueCode = await GetNextIssueCodeAsync(projectId, ct);

        var issue = new Issue
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            TaskId = taskId,
            IssueCode = issueCode,
            Title = title,
            Summary = summary,
            Severity = severityEnum,
            Priority = priorityEnum,
            Status = IssueStatus.Open,
            WorkflowStage = IssueWorkflowStage.Triage,
            ReporterUserId = reporterUserId,
            DueDate = dueDate,
            OpenedAt = DateTimeOffset.UtcNow
        };

        dbContext.Set<Issue>().Add(issue);
        await dbContext.SaveChangesAsync(ct);

        return issue;
    }

    public async Task<(Issue Issue, List<Subtask> Subtasks)?> GetIssueDetailAsync(Guid issueId, CancellationToken ct = default)
    {
        var issue = await dbContext.Set<Issue>()
            .FirstOrDefaultAsync(i => i.Id == issueId, ct);

        if (issue is null)
            return null;

        var subtasks = await dbContext.Set<Subtask>()
            .Where(s => s.IssueId == issueId)
            .ToListAsync(ct);

        return (issue, subtasks);
    }

    public async Task<Issue> UpdateIssueAsync(
        Guid issueId,
        string title,
        string summary,
        string status,
        string severity,
        string priority,
        string workflowStage,
        Guid? currentAssigneeUserId = null,
        Guid? verifiedByUserId = null,
        DateOnly? dueDate = null,
        CancellationToken ct = default)
    {
        var issue = await dbContext.Set<Issue>()
            .FirstOrDefaultAsync(i => i.Id == issueId, ct)
            ?? throw new InvalidOperationException("Issue not found");

        if (!Enum.TryParse<IssueStatus>(status, true, out var statusEnum))
            throw new InvalidOperationException($"Invalid status: {status}");

        if (!Enum.TryParse<IssueSeverity>(severity, true, out var severityEnum))
            throw new InvalidOperationException($"Invalid severity: {severity}");

        if (!Enum.TryParse<WorkTaskPriority>(priority, true, out var priorityEnum))
            throw new InvalidOperationException($"Invalid priority: {priority}");

        if (!Enum.TryParse<IssueWorkflowStage>(workflowStage, true, out var stageEnum))
            throw new InvalidOperationException($"Invalid workflow stage: {workflowStage}");

        // Check if issue can be closed
        if (statusEnum == IssueStatus.Closed)
        {
            var hasIncompleteSubtasks = await dbContext.Set<Subtask>()
                .AnyAsync(s => s.IssueId == issueId && s.State != SubtaskState.Completed, ct);

            if (hasIncompleteSubtasks)
                throw new InvalidOperationException("Cannot close issue while there are incomplete subtasks");
        }

        issue.Title = title;
        issue.Summary = summary;
        issue.Status = statusEnum;
        issue.Severity = severityEnum;
        issue.Priority = priorityEnum;
        issue.WorkflowStage = stageEnum;
        issue.CurrentAssigneeUserId = currentAssigneeUserId;
        issue.VerifiedByUserId = verifiedByUserId;
        issue.DueDate = dueDate;

        if (statusEnum == IssueStatus.Closed && issue.ClosedAt is null)
            issue.ClosedAt = DateTimeOffset.UtcNow;

        if (statusEnum == IssueStatus.Resolved && issue.ResolvedAt is null)
            issue.ResolvedAt = DateTimeOffset.UtcNow;

        dbContext.Set<Issue>().Update(issue);
        await dbContext.SaveChangesAsync(ct);

        return issue;
    }

    public async Task<List<Subtask>> GetIssueSubtasksAsync(Guid issueId, CancellationToken ct = default)
    {
        return await dbContext.Set<Subtask>()
            .Where(s => s.IssueId == issueId)
            .ToListAsync(ct);
    }

    public async Task<string> GetNextIssueCodeAsync(Guid projectId, CancellationToken ct = default)
    {
        var lastIssue = await dbContext.Set<Issue>()
            .Where(i => i.ProjectId == projectId)
            .OrderByDescending(i => i.IssueCode)
            .FirstOrDefaultAsync(ct);

        if (lastIssue is null)
            return "ISS-001";

        var lastNumber = int.Parse(lastIssue.IssueCode.Split('-')[1]);
        return $"ISS-{(lastNumber + 1):D3}";
    }
}
