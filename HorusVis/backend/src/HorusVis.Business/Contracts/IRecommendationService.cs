using HorusVis.Business.Models.Reports;

namespace HorusVis.Business.Contracts;

public interface IRecommendationService
{
    IReadOnlyList<RecommendationItemDto> GetRecommendations(
        ReportDashboardDto dashboard,
        IReadOnlyList<BugDensityItemDto> bugDensity,
        IReadOnlyList<CriticalIssueDto> criticalIssues);
}
