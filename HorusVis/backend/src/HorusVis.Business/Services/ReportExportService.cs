using System.Text;
using HorusVis.Business.Contracts;
using HorusVis.Business.Models.Reports;

namespace HorusVis.Business.Services;

public sealed class ReportExportService : IReportExportService
{
    public Task<byte[]> BuildCsvAsync(
        ReportDashboardDto dashboard,
        IReadOnlyList<BugDensityItemDto> bugDensity,
        IReadOnlyList<TeamPerformanceItemDto> teamPerf,
        IReadOnlyList<CriticalIssueDto> criticalIssues,
        CancellationToken ct)
    {
        var sb = new StringBuilder();

        // KPI section
        sb.AppendLine("Section,Metric,Value");
        sb.AppendLine($"KPI,TotalActiveBugs,{dashboard.TotalActiveBugs}");
        sb.AppendLine($"KPI,AvgTimeToCloseHours,{dashboard.AvgTimeToCloseHours:F1}");
        sb.AppendLine($"KPI,TaskVelocityPoints,{dashboard.TaskVelocityPoints}");
        sb.AppendLine($"KPI,CriticalPriorityCount,{dashboard.CriticalPriorityCount}");
        sb.AppendLine();

        // Bug density section
        sb.AppendLine("BugDensity,FeatureArea,OpenCount,ResolvedCount,AvgTimeToCloseHours");
        foreach (var item in bugDensity)
        {
            sb.AppendLine($"BugDensity,{EscapeCsv(item.FeatureArea)},{item.OpenCount},{item.ResolvedCount},{item.AvgTimeToCloseHours:F1}");
        }
        sb.AppendLine();

        // Team performance section
        sb.AppendLine("TeamPerformance,UserId,FullName,TasksCompleted,TotalPoints");
        foreach (var item in teamPerf)
        {
            sb.AppendLine($"TeamPerformance,{item.UserId},{EscapeCsv(item.FullName)},{item.TasksCompleted},{item.TotalPoints}");
        }
        sb.AppendLine();

        // Critical issues section
        sb.AppendLine("CriticalIssues,IssueCode,Title,Priority,Severity,Status,AssigneeName,OpenedAt");
        foreach (var item in criticalIssues)
        {
            sb.AppendLine($"CriticalIssues,{EscapeCsv(item.IssueCode)},{EscapeCsv(item.Title)},{item.Priority},{item.Severity},{item.Status},{EscapeCsv(item.AssigneeName ?? "")},{item.OpenedAt:O}");
        }

        return Task.FromResult(Encoding.UTF8.GetBytes(sb.ToString()));
    }

    private static string EscapeCsv(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }
}
