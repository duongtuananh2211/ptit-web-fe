namespace HorusVis.Business.Models.Reports;

public sealed record ReportDashboardDto(
    int     TotalActiveBugs,
    double? AvgTimeToCloseHours,
    decimal TaskVelocityPoints,
    int     CriticalPriorityCount,
    double? TotalActiveBugsTrend,
    double? AvgTimeToCloseTrend,
    double? TaskVelocityTrend,
    double? CriticalPriorityTrend
);
