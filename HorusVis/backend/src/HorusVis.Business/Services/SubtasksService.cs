using HorusVis.Business.Contracts;
using HorusVis.Data.Enums;
using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Business.Services;

public sealed class SubtasksService(HorusVisDbContext dbContext, ITasksService tasksService) : ISubtasksService
{
    public async Task<Subtask> CreateTaskSubtaskAsync(
        Guid taskId,
        string title,
        string? description,
        decimal estimateHours,
        decimal toDoHours,
        Guid? ownerUserId = null,
        DateOnly? dueDate = null,
        CancellationToken ct = default)
    {
        var task = await dbContext.Set<WorkTask>()
            .FirstOrDefaultAsync(t => t.Id == taskId, ct)
            ?? throw new InvalidOperationException("Task not found");

        var subtaskCode = await GetNextSubtaskCodeAsync(ct);

        var subtask = new Subtask
        {
            Id = Guid.NewGuid(),
            TaskId = taskId,
            SubtaskCode = subtaskCode,
            Title = title,
            Description = description,
            State = SubtaskState.Todo,
            OwnerUserId = ownerUserId,
            EstimateHours = estimateHours,
            ToDoHours = toDoHours,
            ActualHours = 0,
            DueDate = dueDate,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Set<Subtask>().Add(subtask);
        await dbContext.SaveChangesAsync(ct);

        // Recalculate task progress
        await tasksService.RecalculateTaskProgressAsync(taskId, ct);

        return subtask;
    }

    public async Task<Subtask> CreateIssueSubtaskAsync(
        Guid issueId,
        string title,
        string? description,
        decimal estimateHours,
        decimal toDoHours,
        Guid? ownerUserId = null,
        DateOnly? dueDate = null,
        CancellationToken ct = default)
    {
        var issue = await dbContext.Set<Issue>()
            .FirstOrDefaultAsync(i => i.Id == issueId, ct)
            ?? throw new InvalidOperationException("Issue not found");

        var subtaskCode = await GetNextSubtaskCodeAsync(ct);

        var subtask = new Subtask
        {
            Id = Guid.NewGuid(),
            IssueId = issueId,
            SubtaskCode = subtaskCode,
            Title = title,
            Description = description,
            State = SubtaskState.Todo,
            OwnerUserId = ownerUserId,
            EstimateHours = estimateHours,
            ToDoHours = toDoHours,
            ActualHours = 0,
            DueDate = dueDate,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Set<Subtask>().Add(subtask);
        await dbContext.SaveChangesAsync(ct);

        return subtask;
    }

    public async Task<Subtask> UpdateSubtaskAsync(
        Guid subtaskId,
        string title,
        string? description,
        string state,
        decimal estimateHours,
        decimal toDoHours,
        decimal actualHours,
        Guid? ownerUserId = null,
        DateOnly? dueDate = null,
        CancellationToken ct = default)
    {
        var subtask = await dbContext.Set<Subtask>()
            .FirstOrDefaultAsync(s => s.Id == subtaskId, ct)
            ?? throw new InvalidOperationException("Subtask not found");

        if (!Enum.TryParse<SubtaskState>(state, true, out var stateEnum))
            throw new InvalidOperationException($"Invalid state: {state}");

        subtask.Title = title;
        subtask.Description = description;
        subtask.State = stateEnum;
        subtask.EstimateHours = estimateHours;
        subtask.ToDoHours = toDoHours;
        subtask.ActualHours = actualHours;
        subtask.OwnerUserId = ownerUserId;
        subtask.DueDate = dueDate;
        subtask.UpdatedAt = DateTimeOffset.UtcNow;

        dbContext.Set<Subtask>().Update(subtask);
        await dbContext.SaveChangesAsync(ct);

        // Recalculate parent task/issue progress
        if (subtask.TaskId.HasValue)
        {
            await tasksService.RecalculateTaskProgressAsync(subtask.TaskId.Value, ct);
        }

        return subtask;
    }

    public async Task<string> GetNextSubtaskCodeAsync(CancellationToken ct = default)
    {
        var lastSubtask = await dbContext.Set<Subtask>()
            .OrderByDescending(s => s.SubtaskCode)
            .FirstOrDefaultAsync(ct);

        if (lastSubtask is null)
            return "ST-001";

        var lastNumber = int.Parse(lastSubtask.SubtaskCode.Split('-')[1]);
        return $"ST-{(lastNumber + 1):D3}";
    }
}
