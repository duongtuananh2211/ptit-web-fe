using HorusVis.Business.Models.Reports;

namespace HorusVis.Business.Contracts;

public interface IReportExportService
{
    Task<byte[]> BuildCsvAsync(
        ReportDashboardDto dashboard,
        IReadOnlyList<BugDensityItemDto> bugDensity,
        IReadOnlyList<TeamPerformanceItemDto> teamPerf,
        IReadOnlyList<CriticalIssueDto> criticalIssues,
        CancellationToken ct);
}
