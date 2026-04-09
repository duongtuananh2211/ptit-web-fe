using HorusVis.Business.Models.Reports;

namespace HorusVis.Business.Contracts;

public interface IReportsService
{
    Task<ReportDashboardDto>                    GetDashboardAsync(Guid? projectId, CancellationToken ct);
    Task<IReadOnlyList<BugDensityItemDto>>      GetBugDensityAsync(Guid? projectId, int days, CancellationToken ct);
    Task<IReadOnlyList<TeamPerformanceItemDto>> GetTeamPerformanceAsync(Guid? projectId, int days, CancellationToken ct);
    Task<IReadOnlyList<CriticalIssueDto>>       GetCriticalIssuesAsync(Guid? projectId, int topN, CancellationToken ct);
    Task<IReadOnlyList<RecommendationItemDto>>  GetRecommendationsAsync(Guid? projectId, CancellationToken ct);
    Task<byte[]>                                ExportCsvAsync(Guid? projectId, CancellationToken ct);
}
