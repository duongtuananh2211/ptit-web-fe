using HorusVis.Business.Contracts;
using HorusVis.Business.Models.Reports;
using HorusVis.Data.Enums;
using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Business.Services;

public sealed class ReportsService(
    HorusVisDbContext dbContext,
    IRecommendationService recommendationService,
    IReportExportService exportService) : IReportsService
{
    public async Task<ReportDashboardDto> GetDashboardAsync(Guid? projectId, CancellationToken ct)
    {
        var since = DateTimeOffset.UtcNow.AddDays(-30);

        var activeBugs = await dbContext.Set<Issue>()
            .Where(i => i.Status != IssueStatus.Closed
                        && (projectId == null || i.ProjectId == projectId))
            .CountAsync(ct);

        var avgClose = await dbContext.Set<Issue>()
            .Where(i => i.ClosedAt.HasValue
                        && i.ClosedAt >= since
                        && (projectId == null || i.ProjectId == projectId))
            .Select(i => (double?)(i.ClosedAt!.Value - i.OpenedAt).TotalHours)
            .AverageAsync(ct);

        var velocity = await dbContext.Set<WorkTask>()
            .Where(t => t.Status == WorkTaskStatus.Done
                        && t.UpdatedAt >= since
                        && (projectId == null || t.ProjectId == projectId))
            .SumAsync(t => t.PlanEstimate ?? 0m, ct);

        var critCount = await dbContext.Set<Issue>()
            .Where(i => i.Priority == WorkTaskPriority.Critical
                        && i.Status != IssueStatus.Closed
                        && (projectId == null || i.ProjectId == projectId))
            .CountAsync(ct);

        return new ReportDashboardDto(
            activeBugs,
            avgClose,
            velocity,
            critCount,
            null, null, null, null);
    }

    public async Task<IReadOnlyList<BugDensityItemDto>> GetBugDensityAsync(
        Guid? projectId, int days, CancellationToken ct)
    {
        var result = await dbContext.Set<Issue>()
            .Where(i => i.TaskId.HasValue
                        && (projectId == null || i.ProjectId == projectId))
            .Join(dbContext.Set<WorkTask>(),
                  i => i.TaskId,
                  t => (Guid?)t.Id,
                  (i, t) => new { i, t.FeatureAreaId })
            .Where(x => x.FeatureAreaId.HasValue)
            .Join(dbContext.Set<FeatureArea>(),
                  x => x.FeatureAreaId,
                  fa => (Guid?)fa.Id,
                  (x, fa) => new { x.i, AreaName = fa.AreaName })
            .GroupBy(x => x.AreaName)
            .Select(g => new BugDensityItemDto(
                g.Key,
                g.Count(x => x.i.Status != IssueStatus.Closed),
                g.Count(x => x.i.Status == IssueStatus.Closed),
                g.Where(x => x.i.ClosedAt.HasValue)
                 .Average(x => (double?)(x.i.ClosedAt!.Value - x.i.OpenedAt).TotalHours)))
            .ToListAsync(ct);

        return result;
    }

    public async Task<IReadOnlyList<TeamPerformanceItemDto>> GetTeamPerformanceAsync(
        Guid? projectId, int days, CancellationToken ct)
    {
        var since = DateTimeOffset.UtcNow.AddDays(-days);

        var result = await dbContext.Set<WorkTask>()
            .Where(t => t.Status == WorkTaskStatus.Done
                        && t.UpdatedAt >= since
                        && (projectId == null || t.ProjectId == projectId))
            .Join(dbContext.Set<TaskAssignee>(),
                  t  => t.Id,
                  ta => ta.TaskId,
                  (t, ta) => new { t, ta.UserId })
            .Join(dbContext.Set<User>(),
                  x => x.UserId,
                  u => u.Id,
                  (x, u) => new { x.t, u })
            .GroupBy(x => new { x.u.Id, x.u.FullName, x.u.AvatarUrl })
            .Select(g => new TeamPerformanceItemDto(
                g.Key.Id,
                g.Key.FullName,
                g.Key.AvatarUrl,
                g.Count(),
                g.Sum(x => x.t.PlanEstimate ?? 0m)))
            .ToListAsync(ct);

        return result;
    }

    public async Task<IReadOnlyList<CriticalIssueDto>> GetCriticalIssuesAsync(
        Guid? projectId, int topN, CancellationToken ct)
    {
        var issues = await dbContext.Set<Issue>()
            .Where(i => i.Status != IssueStatus.Closed
                        && (projectId == null || i.ProjectId == projectId))
            .OrderBy(i => i.Priority == WorkTaskPriority.Critical ? 0
                        : i.Priority == WorkTaskPriority.High     ? 1
                        : i.Priority == WorkTaskPriority.Medium   ? 2 : 3)
            .ThenBy(i => i.OpenedAt)
            .Take(topN)
            .GroupJoin(dbContext.Set<User>(),
                       i => i.CurrentAssigneeUserId,
                       u => (Guid?)u.Id,
                       (i, users) => new { i, users })
            .SelectMany(
                x => x.users.DefaultIfEmpty(),
                (x, u) => new CriticalIssueDto(
                    x.i.Id,
                    x.i.IssueCode,
                    x.i.Title,
                    x.i.Priority.ToString(),
                    x.i.Severity.ToString(),
                    x.i.Status.ToString(),
                    u != null ? u.FullName : null,
                    x.i.OpenedAt,
                    x.i.DueDate))
            .ToListAsync(ct);

        return issues;
    }

    public async Task<IReadOnlyList<RecommendationItemDto>> GetRecommendationsAsync(
        Guid? projectId, CancellationToken ct)
    {
        var dashboard      = await GetDashboardAsync(projectId, ct);
        var bugDensity     = await GetBugDensityAsync(projectId, 30, ct);
        var criticalIssues = await GetCriticalIssuesAsync(projectId, 50, ct);

        return recommendationService.GetRecommendations(dashboard, bugDensity, criticalIssues);
    }

    public async Task<byte[]> ExportCsvAsync(Guid? projectId, CancellationToken ct)
    {
        var dashboard      = await GetDashboardAsync(projectId, ct);
        var bugDensity     = await GetBugDensityAsync(projectId, 30, ct);
        var teamPerf       = await GetTeamPerformanceAsync(projectId, 30, ct);
        var criticalIssues = await GetCriticalIssuesAsync(projectId, 50, ct);

        return await exportService.BuildCsvAsync(dashboard, bugDensity, teamPerf, criticalIssues, ct);
    }
}
