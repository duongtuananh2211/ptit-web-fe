using HorusVis.Business.Contracts;
using HorusVis.Business.Models.Reports;

namespace HorusVis.Business.Services;

public sealed class RecommendationService : IRecommendationService
{
    public IReadOnlyList<RecommendationItemDto> GetRecommendations(
        ReportDashboardDto dashboard,
        IReadOnlyList<BugDensityItemDto> bugDensity,
        IReadOnlyList<CriticalIssueDto> criticalIssues)
    {
        var results = new List<RecommendationItemDto>();

        // HIGH_BUG_DENSITY — any feature area has 5+ open bugs
        var densityHotspot = bugDensity.FirstOrDefault(b => b.OpenCount >= 5);
        if (densityHotspot is not null)
        {
            results.Add(new RecommendationItemDto(
                "HIGH_BUG_DENSITY",
                $"High bug density in {densityHotspot.FeatureArea}",
                $"Feature area '{densityHotspot.FeatureArea}' has {densityHotspot.OpenCount} open bugs."));
        }

        // SLOW_RESOLUTION — avg time to close >= 72 hours
        if (dashboard.AvgTimeToCloseHours.HasValue && dashboard.AvgTimeToCloseHours >= 72)
        {
            results.Add(new RecommendationItemDto(
                "SLOW_RESOLUTION",
                "Bug resolution is slow",
                $"Average time to close is {dashboard.AvgTimeToCloseHours:F0}h (threshold: 72h)."));
        }

        // CRITICAL_BACKLOG — 3+ unresolved critical issues
        if (dashboard.CriticalPriorityCount >= 3)
        {
            results.Add(new RecommendationItemDto(
                "CRITICAL_BACKLOG",
                $"{dashboard.CriticalPriorityCount} critical issues are unresolved",
                $"{dashboard.CriticalPriorityCount} critical-priority bugs remain open."));
        }

        // LOW_VELOCITY — fewer than 5 story points completed in last 30 days
        if (dashboard.TaskVelocityPoints < 5)
        {
            results.Add(new RecommendationItemDto(
                "LOW_VELOCITY",
                "Task velocity is below threshold",
                $"Only {dashboard.TaskVelocityPoints} points completed in the last 30 days."));
        }

        // UNASSIGNED_CRITICAL — any open Critical issue has no assignee
        var unassigned = criticalIssues.FirstOrDefault(
            i => i.Priority == "Critical" && i.AssigneeName is null);
        if (unassigned is not null)
        {
            results.Add(new RecommendationItemDto(
                "UNASSIGNED_CRITICAL",
                $"Unassigned critical issue: {unassigned.IssueCode}",
                $"Critical issue {unassigned.IssueCode} — '{unassigned.Title}' has no assignee."));
        }

        return results;
    }
}
