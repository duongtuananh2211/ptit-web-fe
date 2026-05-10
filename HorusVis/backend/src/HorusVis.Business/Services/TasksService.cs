using HorusVis.Business.Contracts;
using HorusVis.Data.Enums;
using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Business.Services;

public sealed class TasksService(HorusVisDbContext dbContext) : ITasksService
{
    public async Task<(List<WorkTask> TodoTasks, List<WorkTask> WorkingTasks, List<WorkTask> StuckTasks, List<WorkTask> DoneTasks)> GetMyBoardAsync(Guid currentUserId, CancellationToken ct = default)
    {
        var tasks = await dbContext.Set<WorkTask>()
            .Where(t => dbContext.Set<TaskAssignee>()
                .Any(ta => ta.TaskId == t.Id
                    && ta.UserId == currentUserId
                    && ta.AssignmentType == AssignmentType.Primary))
            .Include(t => t.FeatureArea)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        var todoTasks = tasks.Where(t => t.Status == WorkTaskStatus.ToDo).ToList();
        var workingTasks = tasks.Where(t => t.Status == WorkTaskStatus.Working).ToList();
        var stuckTasks = tasks.Where(t => t.Status == WorkTaskStatus.Stuck).ToList();
        var doneTasks = tasks.Where(t => t.Status == WorkTaskStatus.Done).ToList();

        return (todoTasks, workingTasks, stuckTasks, doneTasks);
    }

    public async Task<WorkTask> CreateTaskAsync(
        Guid projectId,
        string title,
        string? description,
        string priority,
        Guid createdByUserId,
        Guid? featureAreaId = null,
        decimal? planEstimate = null,
        DateOnly? startDate = null,
        DateOnly? dueDate = null,
        CancellationToken ct = default)
    {
        if (!Enum.TryParse<WorkTaskPriority>(priority, true, out var priorityEnum))
            throw new InvalidOperationException($"Invalid priority: {priority}");

        // Validate FeatureArea exists and belongs to the project
        if (featureAreaId.HasValue)
        {
            var featureArea = await dbContext.Set<FeatureArea>()
                .FirstOrDefaultAsync(fa => fa.Id == featureAreaId.Value && fa.ProjectId == projectId, ct);
            
            if (featureArea is null)
                throw new InvalidOperationException($"FeatureArea with ID {featureAreaId} not found or does not belong to project {projectId}");
        }

        var task = new WorkTask
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            FeatureAreaId = featureAreaId,
            Title = title,
            Description = description,
            Priority = priorityEnum,
            Status = WorkTaskStatus.ToDo,
            PlanEstimate = planEstimate,
            ProgressPercent = 0,
            CreatedByUserId = createdByUserId,
            StartDate = startDate,
            DueDate = dueDate,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Set<WorkTask>().Add(task);
        await dbContext.SaveChangesAsync(ct);

        return task;
    }

    public async Task<(WorkTask Task, List<Issue> Issues, List<Subtask> Subtasks)?> GetTaskDetailAsync(Guid taskId, CancellationToken ct = default)
    {
        var task = await dbContext.Set<WorkTask>()
            .Include(t => t.FeatureArea)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == taskId, ct);

        if (task is null)
            return null;

        var issues = await dbContext.Set<Issue>()
            .Where(i => i.TaskId == taskId)
            .AsNoTracking()
            .OrderByDescending(i => i.OpenedAt)
            .ToListAsync(ct);

        var subtasks = await dbContext.Set<Subtask>()
            .Where(s => s.TaskId == taskId)
            .AsNoTracking()
            .OrderBy(s => s.SubtaskCode)
            .ToListAsync(ct);

        return (task, issues, subtasks);
    }

    public async Task<WorkTask> UpdateTaskAsync(
        Guid taskId,
        string title,
        string? description,
        string status,
        string priority,
        Guid? assigneeUserId = null,
        string? blockedNote = null,
        DateOnly? startDate = null,
        DateOnly? dueDate = null,
        CancellationToken ct = default)
    {
        var task = await dbContext.Set<WorkTask>()
            .FirstOrDefaultAsync(t => t.Id == taskId, ct)
            ?? throw new InvalidOperationException("Task not found");

        if (!Enum.TryParse<WorkTaskStatus>(status, true, out var statusEnum))
            throw new InvalidOperationException($"Invalid status: {status}");

        if (!Enum.TryParse<WorkTaskPriority>(priority, true, out var priorityEnum))
            throw new InvalidOperationException($"Invalid priority: {priority}");

        if (assigneeUserId.HasValue)
        {
            var isProjectMember = await dbContext.Set<ProjectMember>()
                .AnyAsync(pm => pm.ProjectId == task.ProjectId && pm.UserId == assigneeUserId.Value, ct);

            if (!isProjectMember)
                throw new InvalidOperationException("Selected assignee is not a member of this project.");
        }

        // Check if task can move to Done
        if (statusEnum == WorkTaskStatus.Done)
        {
            var hasOpenIssues = await dbContext.Set<Issue>()
                .AnyAsync(i => i.TaskId == taskId && i.Status != IssueStatus.Closed, ct);

            if (hasOpenIssues)
                throw new InvalidOperationException("Cannot mark task as Done while there are open issues");

            var hasIncompleteSubtasks = await dbContext.Set<Subtask>()
                .AnyAsync(s => s.TaskId == taskId && s.State != SubtaskState.Completed, ct);

            if (hasIncompleteSubtasks)
                throw new InvalidOperationException("Cannot mark task as Done while there are incomplete subtasks");
        }

        task.Title = title;
        task.Description = description;
        task.Status = statusEnum;
        task.Priority = priorityEnum;
        task.BlockedNote = blockedNote;
        task.StartDate = startDate;
        task.DueDate = dueDate;
        task.UpdatedAt = DateTimeOffset.UtcNow;

        var primaryAssignee = await dbContext.Set<TaskAssignee>()
            .FirstOrDefaultAsync(ta => ta.TaskId == taskId && ta.AssignmentType == AssignmentType.Primary, ct);

        if (assigneeUserId.HasValue)
        {
            if (primaryAssignee is null)
            {
                dbContext.Set<TaskAssignee>().Add(new TaskAssignee
                {
                    Id = Guid.NewGuid(),
                    TaskId = task.Id,
                    UserId = assigneeUserId.Value,
                    AssignmentType = AssignmentType.Primary,
                    AssignedAt = DateTimeOffset.UtcNow,
                });
            }
            else
            {
                primaryAssignee.UserId = assigneeUserId.Value;
                primaryAssignee.AssignedAt = DateTimeOffset.UtcNow;
                dbContext.Set<TaskAssignee>().Update(primaryAssignee);
            }
        }
        else if (primaryAssignee is not null)
        {
            dbContext.Set<TaskAssignee>().Remove(primaryAssignee);
        }

        dbContext.Set<WorkTask>().Update(task);
        await dbContext.SaveChangesAsync(ct);

        // Sync status if needed (check for blocking issues)
        await SyncTaskStatusIfBlockedAsync(taskId, ct);

        return task;
    }

    public async Task<List<Subtask>> GetTaskSubtasksAsync(Guid taskId, CancellationToken ct = default)
    {
        return await dbContext.Set<Subtask>()
            .Where(s => s.TaskId == taskId)
            .AsNoTracking()
            .OrderBy(s => s.SubtaskCode)
            .ToListAsync(ct);
    }

    public async Task<List<Issue>> GetTaskIssuesAsync(Guid taskId, CancellationToken ct = default)
    {
        return await dbContext.Set<Issue>()
            .Where(i => i.TaskId == taskId)
            .AsNoTracking()
            .OrderByDescending(i => i.OpenedAt)
            .ToListAsync(ct);
    }

    public async Task RecalculateTaskProgressAsync(Guid taskId, CancellationToken ct = default)
    {
        var task = await dbContext.Set<WorkTask>()
            .FirstOrDefaultAsync(t => t.Id == taskId, ct)
            ?? throw new InvalidOperationException("Task not found");

        var subtasks = await dbContext.Set<Subtask>()
            .Where(s => s.TaskId == taskId)
            .ToListAsync(ct);

        if (subtasks.Count == 0)
        {
            task.ProgressPercent = 0;
        }
        else
        {
            decimal totalEstimate = subtasks.Sum(s => s.EstimateHours);
            if (totalEstimate == 0)
            {
                task.ProgressPercent = 0;
            }
            else
            {
                decimal actualHours = subtasks.Sum(s => s.ActualHours);
                decimal progress = (actualHours / totalEstimate) * 100;
                task.ProgressPercent = Math.Min(progress, 100);
            }
        }

        task.UpdatedAt = DateTimeOffset.UtcNow;
        dbContext.Set<WorkTask>().Update(task);
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task SyncTaskStatusIfBlockedAsync(Guid taskId, CancellationToken ct = default)
    {
        var task = await dbContext.Set<WorkTask>()
            .FirstOrDefaultAsync(t => t.Id == taskId, ct)
            ?? throw new InvalidOperationException("Task not found");

        // Check for critical open issues
        var hasCriticalOpenIssues = await dbContext.Set<Issue>()
            .AnyAsync(i => i.TaskId == taskId
                && i.Status != IssueStatus.Closed
                && i.Severity == IssueSeverity.Critical, ct);

        if (hasCriticalOpenIssues && task.Status != WorkTaskStatus.Stuck)
        {
            task.Status = WorkTaskStatus.Stuck;
            task.BlockedNote = "Blocked by critical open issue(s)";
            task.UpdatedAt = DateTimeOffset.UtcNow;
            dbContext.Set<WorkTask>().Update(task);
            await dbContext.SaveChangesAsync(ct);
        }
        // If no critical issues and status is Stuck, consider moving back to Working
        else if (!hasCriticalOpenIssues && task.Status == WorkTaskStatus.Stuck && task.BlockedNote?.Contains("critical") == true)
        {
            task.Status = WorkTaskStatus.Working;
            task.BlockedNote = null;
            task.UpdatedAt = DateTimeOffset.UtcNow;
            dbContext.Set<WorkTask>().Update(task);
            await dbContext.SaveChangesAsync(ct);
        }
    }
}
