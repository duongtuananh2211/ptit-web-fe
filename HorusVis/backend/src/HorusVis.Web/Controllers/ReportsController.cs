using HorusVis.Business.Contracts;
using HorusVis.Business.Models.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/reports")]
public sealed class ReportsController(
    IReportsService reports,
    IRecommendationService recommendations,
    IReportExportService export) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<ReportDashboardDto>> GetDashboard(
        [FromQuery] Guid? projectId, CancellationToken ct)
    {
        var result = await reports.GetDashboardAsync(projectId, ct);
        return Ok(result);
    }

    [HttpGet("bug-density")]
    public async Task<ActionResult<IReadOnlyList<BugDensityItemDto>>> GetBugDensity(
        [FromQuery] Guid? projectId, [FromQuery] int days = 30, CancellationToken ct = default)
    {
        if (days < 1 || days > 365)
            return ValidationProblem("days must be between 1 and 365.");

        var result = await reports.GetBugDensityAsync(projectId, days, ct);
        return Ok(result);
    }

    [HttpGet("team-performance")]
    public async Task<ActionResult<IReadOnlyList<TeamPerformanceItemDto>>> GetTeamPerformance(
        [FromQuery] Guid? projectId, [FromQuery] int days = 30, CancellationToken ct = default)
    {
        if (days < 1 || days > 365)
            return ValidationProblem("days must be between 1 and 365.");

        var result = await reports.GetTeamPerformanceAsync(projectId, days, ct);
        return Ok(result);
    }

    [HttpGet("critical-issues")]
    public async Task<ActionResult<IReadOnlyList<CriticalIssueDto>>> GetCriticalIssues(
        [FromQuery] Guid? projectId, [FromQuery] int topN = 10, CancellationToken ct = default)
    {
        if (topN < 1 || topN > 50)
            return ValidationProblem("topN must be between 1 and 50.");

        var result = await reports.GetCriticalIssuesAsync(projectId, topN, ct);
        return Ok(result);
    }

    [HttpGet("recommendations")]
    public async Task<ActionResult<IReadOnlyList<RecommendationItemDto>>> GetRecommendations(
        [FromQuery] Guid? projectId, CancellationToken ct)
    {
        var dashboard      = await reports.GetDashboardAsync(projectId, ct);
        var bugDensity     = await reports.GetBugDensityAsync(projectId, 30, ct);
        var criticalIssues = await reports.GetCriticalIssuesAsync(projectId, 50, ct);
        var result         = recommendations.GetRecommendations(dashboard, bugDensity, criticalIssues);
        return Ok(result);
    }

    [HttpPost("export")]
    public async Task<IActionResult> Export(
        [FromQuery] string format = "csv", [FromQuery] Guid? projectId = null, CancellationToken ct = default)
    {
        if (!string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase))
            return ValidationProblem("Only format=csv is supported.");

        var dashboard      = await reports.GetDashboardAsync(projectId, ct);
        var bugDensity     = await reports.GetBugDensityAsync(projectId, 30, ct);
        var teamPerf       = await reports.GetTeamPerformanceAsync(projectId, 30, ct);
        var criticalIssues = await reports.GetCriticalIssuesAsync(projectId, 50, ct);

        var bytes    = await export.BuildCsvAsync(dashboard, bugDensity, teamPerf, criticalIssues, ct);
        var fileName = $"report_{DateOnly.FromDateTime(DateTime.UtcNow)}.csv";
        return File(bytes, "text/csv", fileName);
    }
}
