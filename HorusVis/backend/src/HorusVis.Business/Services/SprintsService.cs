using HorusVis.Business.Contracts;
using HorusVis.Business.Models.Sprints;
using HorusVis.Data.Enums;
using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Business.Services;

public sealed class SprintsService(HorusVisDbContext dbContext) : ISprintsService
{
    // ─── Read queries ──────────────────────────────────────────────────────

    public async Task<IReadOnlyList<SprintDto>> GetAllSprintsAsync(CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return await dbContext.Set<Sprint>()
            .OrderBy(s => s.StartDate)
            .Select(s => new SprintDto(
                s.Id,
                s.SprintCode,
                s.StartDate,
                s.EndDate,
                s.Goal,
                s.StartDate <= today && today <= s.EndDate))
            .ToListAsync(ct);
    }

    public async Task<SprintDto?> GetCurrentSprintAsync(CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var sprint = await dbContext.Set<Sprint>()
            .FirstOrDefaultAsync(s => s.StartDate <= today && today <= s.EndDate, ct);

        return sprint is null ? null : MapToDto(sprint, isCurrent: true);
    }

    public async Task<SprintDto> GetSprintByIdAsync(Guid sprintId, CancellationToken ct = default)
    {
        var sprint = await dbContext.Set<Sprint>()
            .FirstOrDefaultAsync(s => s.Id == sprintId, ct)
            ?? throw new KeyNotFoundException($"Sprint {sprintId} not found.");

        return MapToDto(sprint);
    }

    public async Task<SprintDto> GetSprintByCodeAsync(string sprintCode, CancellationToken ct = default)
    {
        var sprint = await dbContext.Set<Sprint>()
            .FirstOrDefaultAsync(s => s.SprintCode.ToLower() == sprintCode.ToLower(), ct)
            ?? throw new KeyNotFoundException($"Sprint '{sprintCode}' not found.");

        return MapToDto(sprint);
    }

    public async Task<SprintBoardDto> GetSprintBoardAsync(Guid sprintId, CancellationToken ct = default)
    {
        var sprint = await dbContext.Set<Sprint>()
            .FirstOrDefaultAsync(s => s.Id == sprintId, ct)
            ?? throw new KeyNotFoundException($"Sprint {sprintId} not found.");

        // Load tasks in this sprint
        var tasks = await dbContext.Set<WorkTask>()
            .Where(t => t.SprintId == sprintId)
            .OrderBy(t => t.CreatedAt)
            .ToListAsync(ct);

        // Load primary assignees for those tasks
        var taskIds = tasks.Select(t => t.Id).ToList();
        var assignees = await dbContext.Set<TaskAssignee>()
            .Where(a => taskIds.Contains(a.TaskId))
            .Join(dbContext.Set<User>(), a => a.UserId, u => u.Id,
                (a, u) => new { a.TaskId, a.UserId, u.FullName, a.AssignmentType })
            .ToListAsync(ct);

        var assigneeMap = assignees
            .GroupBy(a => a.TaskId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderBy(a => a.AssignmentType == AssignmentType.Primary ? 0 : 1).First());

        // Group tasks by status into 4 columns
        var statusOrder = new[] {
            WorkTaskStatus.ToDo, WorkTaskStatus.Working,
            WorkTaskStatus.Stuck, WorkTaskStatus.Done
        };

        var taskColumns = statusOrder.Select(status =>
        {
            var columnTasks = tasks
                .Where(t => t.Status == status)
                .Select(t =>
                {
                    var a = assigneeMap.GetValueOrDefault(t.Id);
                    return new SprintBoardTaskItem(
                        t.Id,
                        t.Title,
                        t.Status.ToString(),
                        t.Priority.ToString(),
                        a?.UserId,
                        a?.FullName);
                })
                .ToList();

            return new SprintBoardColumn(status.ToString(), columnTasks.Count, columnTasks);
        }).ToList();

        // Load issues in this sprint with assignee info
        var issues = await dbContext.Set<Issue>()
            .Where(i => i.SprintId == sprintId)
            .GroupJoin(
                dbContext.Set<User>(),
                i => i.CurrentAssigneeUserId,
                u => u.Id,
                (i, users) => new { i, users })
            .SelectMany(
                x => x.users.DefaultIfEmpty(),
                (x, u) => new SprintBoardIssueItem(
                    x.i.Id,
                    x.i.IssueCode,
                    x.i.Title,
                    x.i.Severity.ToString(),
                    x.i.Status.ToString(),
                    x.i.CurrentAssigneeUserId,
                    u != null ? u.FullName : null))
            .ToListAsync(ct);

        return new SprintBoardDto(MapToDto(sprint), taskColumns, issues);
    }

    public async Task<BacklogDto> GetProjectBacklogAsync(Guid projectId, Guid callerId, CancellationToken ct = default)
    {
        var projectExists = await dbContext.Set<Project>().AnyAsync(p => p.Id == projectId, ct);
        if (!projectExists)
            throw new KeyNotFoundException($"Project {projectId} not found.");

        var isMember = await dbContext.Set<ProjectMember>()
            .AnyAsync(m => m.ProjectId == projectId
                        && m.UserId == callerId
                        && m.MemberStatus == MemberStatus.Active, ct);
        if (!isMember)
            throw new UnauthorizedAccessException("Caller is not an active member of this project.");

        var tasks = await dbContext.Set<WorkTask>()
            .Where(t => t.ProjectId == projectId && t.SprintId == null)
            .Join(dbContext.Set<Project>(), t => t.ProjectId, p => p.Id,
                (t, p) => new { t, ProjectName = p.ProjectName })
            .GroupJoin(
                dbContext.Set<FeatureArea>(),
                x => x.t.FeatureAreaId,
                a => a.Id,
                (x, areas) => new { x.t, x.ProjectName, areas })
            .SelectMany(
                x => x.areas.DefaultIfEmpty(),
                (x, area) => new BacklogTaskItem(
                    x.t.Id,
                    x.t.Title,
                    x.t.Status.ToString(),
                    x.t.Priority.ToString(),
                    x.t.ProjectId,
                    x.ProjectName,
                    x.t.FeatureAreaId,
                    area != null ? area.AreaName : null))
            .ToListAsync(ct);

        var issues = await dbContext.Set<Issue>()
            .Where(i => i.ProjectId == projectId && i.SprintId == null)
            .Join(dbContext.Set<Project>(), i => i.ProjectId, p => p.Id,
                (i, p) => new BacklogIssueItem(
                    i.Id,
                    i.IssueCode,
                    i.Title,
                    i.Severity.ToString(),
                    i.Status.ToString(),
                    i.ProjectId,
                    p.ProjectName))
            .ToListAsync(ct);

        return new BacklogDto(tasks, issues);
    }

    public async Task<SprintBoardDto?> GetProjectSprintBoardAsync(Guid projectId, Guid? sprintId, Guid callerId, CancellationToken ct = default)
    {
        var projectExists = await dbContext.Set<Project>().AnyAsync(p => p.Id == projectId, ct);
        if (!projectExists)
            throw new KeyNotFoundException($"Project {projectId} not found.");

        var isMember = await dbContext.Set<ProjectMember>()
            .AnyAsync(m => m.ProjectId == projectId
                        && m.UserId == callerId
                        && m.MemberStatus == MemberStatus.Active, ct);
        if (!isMember)
            throw new UnauthorizedAccessException("Caller is not an active member of this project.");

        Sprint? sprint;
        if (sprintId.HasValue)
        {
            sprint = await dbContext.Set<Sprint>()
                .FirstOrDefaultAsync(s => s.Id == sprintId.Value, ct)
                ?? throw new KeyNotFoundException($"Sprint {sprintId} not found.");
        }
        else
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            sprint = await dbContext.Set<Sprint>()
                .FirstOrDefaultAsync(s => s.StartDate <= today && today <= s.EndDate, ct);

            if (sprint is null)
                return null; // between sprints — caller shows "no active sprint" UI
        }

        // Load tasks for this project + sprint
        var tasks = await dbContext.Set<WorkTask>()
            .Where(t => t.ProjectId == projectId && t.SprintId == sprint.Id)
            .OrderBy(t => t.CreatedAt)
            .ToListAsync(ct);

        var taskIds = tasks.Select(t => t.Id).ToList();
        var assignees = await dbContext.Set<TaskAssignee>()
            .Where(a => taskIds.Contains(a.TaskId))
            .Join(dbContext.Set<User>(), a => a.UserId, u => u.Id,
                (a, u) => new { a.TaskId, a.UserId, u.FullName, a.AssignmentType })
            .ToListAsync(ct);

        var assigneeMap = assignees
            .GroupBy(a => a.TaskId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderBy(a => a.AssignmentType == AssignmentType.Primary ? 0 : 1).First());

        var statusOrder = new[] {
            WorkTaskStatus.ToDo, WorkTaskStatus.Working,
            WorkTaskStatus.Stuck, WorkTaskStatus.Done
        };

        var taskColumns = statusOrder.Select(status =>
        {
            var columnTasks = tasks
                .Where(t => t.Status == status)
                .Select(t =>
                {
                    var a = assigneeMap.GetValueOrDefault(t.Id);
                    return new SprintBoardTaskItem(t.Id, t.Title, t.Status.ToString(), t.Priority.ToString(), a?.UserId, a?.FullName);
                })
                .ToList();
            return new SprintBoardColumn(status.ToString(), columnTasks.Count, columnTasks);
        }).ToList();

        // Load issues for this project + sprint
        var issues = await dbContext.Set<Issue>()
            .Where(i => i.ProjectId == projectId && i.SprintId == sprint.Id)
            .GroupJoin(
                dbContext.Set<User>(),
                i => i.CurrentAssigneeUserId,
                u => u.Id,
                (i, users) => new { i, users })
            .SelectMany(
                x => x.users.DefaultIfEmpty(),
                (x, u) => new SprintBoardIssueItem(
                    x.i.Id, x.i.IssueCode, x.i.Title,
                    x.i.Severity.ToString(), x.i.Status.ToString(),
                    x.i.CurrentAssigneeUserId,
                    u != null ? u.FullName : null))
            .ToListAsync(ct);

        return new SprintBoardDto(MapToDto(sprint), taskColumns, issues);
    }

    // ─── Phase 2: Sprint item assignment ──────────────────────────────────

    public async Task AssignTaskToSprintAsync(Guid sprintId, Guid taskId, Guid callerId, CancellationToken ct = default)
    {
        var sprintExists = await dbContext.Set<Sprint>().AnyAsync(s => s.Id == sprintId, ct);
        if (!sprintExists)
            throw new KeyNotFoundException($"Sprint {sprintId} not found.");

        var task = await dbContext.Set<WorkTask>().FirstOrDefaultAsync(t => t.Id == taskId, ct)
            ?? throw new KeyNotFoundException($"Task {taskId} not found.");

        await EnsureActiveMemberAsync(task.ProjectId, callerId, ct);

        task.SprintId = sprintId;
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task UnassignTaskFromSprintAsync(Guid taskId, Guid callerId, CancellationToken ct = default)
    {
        var task = await dbContext.Set<WorkTask>().FirstOrDefaultAsync(t => t.Id == taskId, ct)
            ?? throw new KeyNotFoundException($"Task {taskId} not found.");

        await EnsureActiveMemberAsync(task.ProjectId, callerId, ct);

        task.SprintId = null;
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task AssignIssueToSprintAsync(Guid sprintId, Guid issueId, Guid callerId, CancellationToken ct = default)
    {
        var sprintExists = await dbContext.Set<Sprint>().AnyAsync(s => s.Id == sprintId, ct);
        if (!sprintExists)
            throw new KeyNotFoundException($"Sprint {sprintId} not found.");

        var issue = await dbContext.Set<Issue>().FirstOrDefaultAsync(i => i.Id == issueId, ct)
            ?? throw new KeyNotFoundException($"Issue {issueId} not found.");

        await EnsureActiveMemberAsync(issue.ProjectId, callerId, ct);

        issue.SprintId = sprintId;
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task UnassignIssueFromSprintAsync(Guid issueId, Guid callerId, CancellationToken ct = default)
    {
        var issue = await dbContext.Set<Issue>().FirstOrDefaultAsync(i => i.Id == issueId, ct)
            ?? throw new KeyNotFoundException($"Issue {issueId} not found.");

        await EnsureActiveMemberAsync(issue.ProjectId, callerId, ct);

        issue.SprintId = null;
        await dbContext.SaveChangesAsync(ct);
    }

    // ─── helpers ──────────────────────────────────────────────────────────

    private async Task EnsureActiveMemberAsync(Guid projectId, Guid callerId, CancellationToken ct)
    {
        var isMember = await dbContext.Set<ProjectMember>()
            .AnyAsync(m => m.ProjectId == projectId
                        && m.UserId == callerId
                        && m.MemberStatus == MemberStatus.Active, ct);
        if (!isMember)
            throw new UnauthorizedAccessException("Caller is not an active member of this project.");
    }

    private static SprintDto MapToDto(Sprint sprint, bool? isCurrent = null)
    {
        var computedCurrent = isCurrent ?? (
            DateOnly.FromDateTime(DateTime.UtcNow) is var today &&
            sprint.StartDate <= today && today <= sprint.EndDate);
        return new SprintDto(sprint.Id, sprint.SprintCode, sprint.StartDate, sprint.EndDate, sprint.Goal, computedCurrent);
    }
}
