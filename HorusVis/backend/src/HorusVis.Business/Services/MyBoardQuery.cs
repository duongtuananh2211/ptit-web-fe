using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Business.Services;

/// <summary>
/// Query service for fetching my board with all related data
/// </summary>
public sealed class MyBoardQuery(HorusVisDbContext dbContext)
{
    /// <summary>
    /// Get complete board data for current user with all task details
    /// </summary>
    public async Task<MyBoardData> GetMyBoardCompleteAsync(Guid userId, CancellationToken ct = default)
    {
        var tasks = await dbContext.Set<WorkTask>()
            .Where(t => t.CreatedByUserId == userId)
            .AsNoTracking()
            .ToListAsync(ct);

        if (!tasks.Any())
            return new MyBoardData([], [], [], []);

        var taskIds = tasks.Select(t => t.Id).ToList();

        // Fetch all related issues
        var issues = await dbContext.Set<Issue>()
            .Where(i => taskIds.Contains(i.TaskId.Value))
            .AsNoTracking()
            .ToListAsync(ct);

        // Fetch all related subtasks
        var subtasks = await dbContext.Set<Subtask>()
            .Where(s => taskIds.Contains(s.TaskId.Value))
            .AsNoTracking()
            .ToListAsync(ct);

        var taskIssuesMap = issues.GroupBy(i => i.TaskId.Value).ToDictionary(g => g.Key, g => g.ToList());
        var taskSubtasksMap = subtasks.GroupBy(s => s.TaskId.Value).ToDictionary(g => g.Key, g => g.ToList());

        var todoTasks = tasks.Where(t => t.Status.ToString() == "Todo").ToList();
        var workingTasks = tasks.Where(t => t.Status.ToString() == "Working").ToList();
        var stuckTasks = tasks.Where(t => t.Status.ToString() == "Stuck").ToList();
        var doneTasks = tasks.Where(t => t.Status.ToString() == "Done").ToList();

        return new MyBoardData(
            TodoTasks: MapWithRelations(todoTasks, taskIssuesMap, taskSubtasksMap),
            WorkingTasks: MapWithRelations(workingTasks, taskIssuesMap, taskSubtasksMap),
            StuckTasks: MapWithRelations(stuckTasks, taskIssuesMap, taskSubtasksMap),
            DoneTasks: MapWithRelations(doneTasks, taskIssuesMap, taskSubtasksMap)
        );
    }

    private List<TaskWithRelations> MapWithRelations(
        List<WorkTask> tasks,
        Dictionary<Guid, List<Issue>> issuesMap,
        Dictionary<Guid, List<Subtask>> subtasksMap)
    {
        return tasks.Select(t => new TaskWithRelations(
            Task: t,
            Issues: issuesMap.TryGetValue(t.Id, out var issues) ? issues : [],
            Subtasks: subtasksMap.TryGetValue(t.Id, out var subtasks) ? subtasks : []
        )).ToList();
    }
}

/// <summary>
/// Complete board data structure
/// </summary>
public record MyBoardData(
    List<TaskWithRelations> TodoTasks,
    List<TaskWithRelations> WorkingTasks,
    List<TaskWithRelations> StuckTasks,
    List<TaskWithRelations> DoneTasks
);

/// <summary>
/// Task with related issues and subtasks
/// </summary>
public record TaskWithRelations(
    WorkTask Task,
    List<Issue> Issues,
    List<Subtask> Subtasks
);
