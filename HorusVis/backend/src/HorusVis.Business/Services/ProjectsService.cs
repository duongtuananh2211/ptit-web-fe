using HorusVis.Business.Contracts;
using HorusVis.Business.Models.Projects;
using HorusVis.Data.Enums;
using HorusVis.Data.Persistence;
using HorusVis.Data.Horusvis.Entities;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Business.Services;

public sealed class ProjectsService(HorusVisDbContext dbContext) : IProjectsService
{
    public async Task<ProjectListResponse> GetProjectsAsync(ProjectListFilter filter, Guid callerId, CancellationToken ct = default)
    {
        var query = dbContext.Set<Project>()
            .Join(dbContext.Set<User>(), p => p.OwnerUserId, u => u.Id, (p, u) => new { p, OwnerName = u.FullName });

        if (!string.IsNullOrWhiteSpace(filter.Status) &&
            Enum.TryParse<ProjectStatus>(filter.Status, ignoreCase: true, out var statusEnum))
        {
            query = query.Where(x => x.p.Status == statusEnum);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.ToLower();
            query = query.Where(x =>
                x.p.ProjectName.ToLower().Contains(term) ||
                x.p.ProjectKey.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(ct);

        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize   = Math.Clamp(filter.PageSize, 1, 100);

        var memberCounts = await dbContext.Set<ProjectMember>()
            .GroupBy(m => m.ProjectId)
            .Select(g => new { ProjectId = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var memberCountMap = memberCounts.ToDictionary(x => x.ProjectId, x => x.Count);

        var items = await query
            .OrderByDescending(x => x.p.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.p.Id,
                x.p.ProjectKey,
                x.p.ProjectName,
                x.p.Status,
                x.p.OwnerUserId,
                x.OwnerName,
                x.p.StartDate,
                x.p.EndDate,
            })
            .ToListAsync(ct);

        var result = items.Select(x => new ProjectListItem(
            Id:               x.Id,
            ProjectKey:       x.ProjectKey,
            ProjectName:      x.ProjectName,
            Status:           x.Status.ToString(),
            OwnerUserId:      x.OwnerUserId,
            OwnerDisplayName: x.OwnerName,
            StartDate:        x.StartDate,
            EndDate:          x.EndDate,
            MemberCount:      memberCountMap.TryGetValue(x.Id, out var c) ? c : 0
        )).ToList();

        return new ProjectListResponse(result, totalCount, pageNumber, pageSize);
    }

    public async Task<ProjectDetailResponse> GetProjectByIdAsync(Guid projectId, Guid callerId, CancellationToken ct = default)
    {
        var project = await dbContext.Set<Project>()
            .Include(p => p.OwnerUser)
            .FirstOrDefaultAsync(p => p.Id == projectId, ct)
            ?? throw new KeyNotFoundException($"Project {projectId} not found.");

        var members      = await GetMembersAsync(projectId, ct);
        var featureAreas = await GetFeatureAreasForProjectAsync(projectId, ct);

        return MapToDetail(project, members, featureAreas);
    }

    public async Task<ProjectDetailResponse> CreateProjectAsync(CreateProjectRequest request, Guid callerId, CancellationToken ct = default)
    {
        var duplicate = await dbContext.Set<Project>()
            .AnyAsync(p => p.ProjectKey == request.ProjectKey, ct);

        if (duplicate)
            throw new InvalidOperationException($"Project key '{request.ProjectKey}' already exists.");

        var project = new Project
        {
            Id          = Guid.NewGuid(),
            ProjectKey  = request.ProjectKey,
            ProjectName = request.ProjectName,
            Description = request.Description,
            OwnerUserId = callerId,
            Status      = ProjectStatus.Active,
            StartDate   = request.StartDate,
            EndDate     = request.EndDate,
            CreatedAt   = DateTimeOffset.UtcNow,
        };

        dbContext.Set<Project>().Add(project);

        var ownerMember = new ProjectMember
        {
            Id           = Guid.NewGuid(),
            ProjectId    = project.Id,
            UserId       = callerId,
            ProjectRole  = "Owner",
            MemberStatus = MemberStatus.Active,
            JoinedAt     = DateTimeOffset.UtcNow,
        };

        dbContext.Set<ProjectMember>().Add(ownerMember);
        await dbContext.SaveChangesAsync(ct);

        return await GetProjectByIdAsync(project.Id, callerId, ct);
    }

    public async Task<ProjectDetailResponse> UpdateProjectAsync(Guid projectId, UpdateProjectRequest request, Guid callerId, CancellationToken ct = default)
    {
        var project = await dbContext.Set<Project>()
            .FirstOrDefaultAsync(p => p.Id == projectId, ct)
            ?? throw new KeyNotFoundException($"Project {projectId} not found.");

        if (project.OwnerUserId != callerId)
            throw new UnauthorizedAccessException("Only the project owner can update project details.");

        if (!Enum.TryParse<ProjectStatus>(request.Status, ignoreCase: true, out var newStatus))
            throw new InvalidOperationException($"Invalid status '{request.Status}'.");

        project.ProjectName = request.ProjectName;
        project.Description = request.Description;
        project.Status      = newStatus;
        project.StartDate   = request.StartDate;
        project.EndDate     = request.EndDate;

        await dbContext.SaveChangesAsync(ct);

        return await GetProjectByIdAsync(projectId, callerId, ct);
    }

    public async Task ArchiveProjectAsync(Guid projectId, Guid callerId, CancellationToken ct = default)
    {
        var project = await dbContext.Set<Project>()
            .FirstOrDefaultAsync(p => p.Id == projectId, ct)
            ?? throw new KeyNotFoundException($"Project {projectId} not found.");

        if (project.OwnerUserId != callerId)
            throw new UnauthorizedAccessException("Only the project owner can archive this project.");

        project.Status = ProjectStatus.Archived;
        await dbContext.SaveChangesAsync(ct);
    }

    // ─── private helpers ───────────────────────────────────────────────────────

    private async Task<List<ProjectMemberDto>> GetMembersAsync(Guid projectId, CancellationToken ct) =>
        await dbContext.Set<ProjectMember>()
            .Where(m => m.ProjectId == projectId)
            .Join(dbContext.Set<User>(), m => m.UserId, u => u.Id, (m, u) => new ProjectMemberDto(
                MemberId:     m.Id,
                UserId:       m.UserId,
                DisplayName:  u.FullName,
                Email:        u.Email,
                AvatarUrl:    u.AvatarUrl,
                ProjectRole:  m.ProjectRole,
                MemberStatus: m.MemberStatus.ToString(),
                JoinedAt:     m.JoinedAt
            ))
            .ToListAsync(ct);

    private async Task<List<FeatureAreaDto>> GetFeatureAreasForProjectAsync(Guid projectId, CancellationToken ct) =>
        await dbContext.Set<FeatureArea>()
            .Where(a => a.ProjectId == projectId)
            .OrderBy(a => a.SortOrder)
            .Select(a => new FeatureAreaDto(a.Id, a.AreaCode, a.AreaName, a.ColorHex, a.SortOrder))
            .ToListAsync(ct);

    private static ProjectDetailResponse MapToDetail(
        Project project,
        List<ProjectMemberDto> members,
        List<FeatureAreaDto> featureAreas) =>
        new(
            Id:               project.Id,
            ProjectKey:       project.ProjectKey,
            ProjectName:      project.ProjectName,
            Description:      project.Description,
            Status:           project.Status.ToString(),
            OwnerUserId:      project.OwnerUserId,
            OwnerDisplayName: project.OwnerUser.FullName,
            StartDate:        project.StartDate,
            EndDate:          project.EndDate,
            CreatedAt:        project.CreatedAt,
            Members:          members,
            FeatureAreas:     featureAreas
        );

    // ─── Phase 2 aggregation methods ──────────────────────────────────────────

    public async Task<ProjectOverviewDto> GetProjectOverviewAsync(Guid projectId, CancellationToken ct = default)
    {
        var exists = await dbContext.Set<Project>().AnyAsync(p => p.Id == projectId, ct);
        if (!exists)
            throw new KeyNotFoundException($"Project {projectId} not found.");

        // VelocityScore: tasks completed in the last 21 days divided across 3 weeks
        var since21 = DateTimeOffset.UtcNow.AddDays(-21);
        var doneLast21 = await dbContext.Set<WorkTask>()
            .CountAsync(t => t.ProjectId == projectId
                          && t.Status     == WorkTaskStatus.Done
                          && t.UpdatedAt  >= since21, ct);
        var velocityScore = Math.Round(doneLast21 / 3.0m, 1);

        // TODO: Implement when Milestones table is added in a future migration.
        MilestoneDto? nextMilestone = null;

        // TeamWorkload: active task count per assignee
        var workload = await dbContext.Set<WorkTask>()
            .Where(t => t.ProjectId == projectId && t.Status != WorkTaskStatus.Done)
            .Join(dbContext.Set<TaskAssignee>(),
                  t  => t.Id,
                  ta => ta.TaskId,
                  (t, ta) => new { ta.UserId })
            .Join(dbContext.Set<User>(),
                  x => x.UserId,
                  u => u.Id,
                  (x, u) => new { u.Id, u.FullName })
            .GroupBy(x => new { x.Id, x.FullName })
            .Select(g => new TeamWorkloadItem(g.Key.Id, g.Key.FullName, g.Count()))
            .OrderByDescending(x => x.TaskCount)
            .ToListAsync(ct);

        // TaskSummary: count by status
        var summary = await dbContext.Set<WorkTask>()
            .Where(t => t.ProjectId == projectId)
            .GroupBy(_ => 1)
            .Select(g => new TaskSummaryDto(
                g.Count(t => t.Status == WorkTaskStatus.ToDo),
                g.Count(t => t.Status == WorkTaskStatus.Working),
                g.Count(t => t.Status == WorkTaskStatus.Stuck),
                g.Count(t => t.Status == WorkTaskStatus.Done)))
            .FirstOrDefaultAsync(ct)
            ?? new TaskSummaryDto(0, 0, 0, 0);

        return new ProjectOverviewDto(velocityScore, nextMilestone, workload, summary);
    }

    public async Task<ProjectBoardPreviewDto> GetBoardPreviewAsync(Guid projectId, CancellationToken ct = default)
    {
        var exists = await dbContext.Set<Project>().AnyAsync(p => p.Id == projectId, ct);
        if (!exists)
            throw new KeyNotFoundException($"Project {projectId} not found.");

        var statuses = new[]
        {
            WorkTaskStatus.ToDo,
            WorkTaskStatus.Working,
            WorkTaskStatus.Stuck,
            WorkTaskStatus.Done,
        };

        var columns = new List<BoardColumnDto>();

        foreach (var status in statuses)
        {
            var totalCount = await dbContext.Set<WorkTask>()
                .CountAsync(t => t.ProjectId == projectId && t.Status == status, ct);

            // Load top-5 tasks (ordered by priority desc then by creation date)
            var taskRows = await dbContext.Set<WorkTask>()
                .Where(t => t.ProjectId == projectId && t.Status == status)
                .OrderBy(t => t.Priority == WorkTaskPriority.Critical ? 0
                            : t.Priority == WorkTaskPriority.High     ? 1
                            : t.Priority == WorkTaskPriority.Medium   ? 2 : 3)
                .ThenBy(t => t.CreatedAt)
                .Take(5)
                .Select(t => new { t.Id, t.Title, t.Priority })
                .ToListAsync(ct);

            var taskIds = taskRows.Select(t => t.Id).ToList();

            // Load assignees for those tasks in a separate query to avoid client-eval
            var assigneeMap = await dbContext.Set<TaskAssignee>()
                .Where(ta => taskIds.Contains(ta.TaskId))
                .GroupBy(ta => ta.TaskId)
                .Select(g => new { TaskId = g.Key, UserId = g.OrderBy(ta => ta.AssignedAt).First().UserId })
                .ToListAsync(ct);

            var assigneeDict = assigneeMap.ToDictionary(x => x.TaskId, x => (Guid?)x.UserId);

            var topTasks = taskRows.Select(t => new BoardTaskPreviewItem(
                Id:             t.Id,
                Title:          t.Title,
                Priority:       t.Priority.ToString(),
                AssigneeUserId: assigneeDict.TryGetValue(t.Id, out var uid) ? uid : null
            )).ToList();

            columns.Add(new BoardColumnDto(status.ToString(), totalCount, topTasks));
        }

        return new ProjectBoardPreviewDto(columns);
    }
}
