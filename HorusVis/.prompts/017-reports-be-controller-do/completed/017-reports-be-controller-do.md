<objective>
Implement Reports Backend Phase 3: replace the scaffold ReportsController with a
fully-implemented controller that wires IReportsService, IRecommendationService, and
IReportExportService to 5 GET endpoints and 1 POST export endpoint. Add query-parameter
validation and proper authorization.

Purpose: Exposes the complete Reports API surface to the frontend — all 6 routes with
validated params, correct return types, and CSV file response — after Phase 1+2 services
are in place.
Output: 1 modified C# file (ReportsController.cs); project builds with 0 CS errors.
</objective>

<context>
Detailed phase plan (Phase 3):
@.prompts/011-reports-plan/reports-plan.md

Task specification and API contract:
@docs/outlines/tasks/04-reports/README.md

Current placeholder controller (read before editing):
@backend/src/HorusVis.Web/Controllers/ReportsController.cs

Reference controller for style/pattern (existing, working):
@backend/src/HorusVis.Web/Controllers/ProjectsController.cs

DTOs and interfaces created in Phase 1+2:
@backend/src/HorusVis.Business/Contracts/IReportsService.cs
@backend/src/HorusVis.Business/Contracts/IRecommendationService.cs
@backend/src/HorusVis.Business/Contracts/IReportExportService.cs
@backend/src/HorusVis.Business/Models/Reports/ReportDashboardDto.cs
</context>

<requirements>
1. REPLACE ReportsController — Fully replace `backend/src/HorusVis.Web/Controllers/ReportsController.cs`:

   ```csharp
   [ApiController]
   [Authorize]
   [Route("api/reports")]
   public sealed class ReportsController : ControllerBase
   {
       private readonly IReportsService       _reports;
       private readonly IRecommendationService _recommendations;
       private readonly IReportExportService   _export;

       public ReportsController(
           IReportsService reports,
           IRecommendationService recommendations,
           IReportExportService export)
       { _reports = reports; _recommendations = recommendations; _export = export; }
   }
   ```

2. GET /api/reports/dashboard
   ```csharp
   [HttpGet("dashboard")]
   public async Task<ActionResult<ReportDashboardDto>>
       GetDashboard([FromQuery] Guid? projectId, CancellationToken ct)
   ```
   → Call `_reports.GetDashboardAsync(projectId, ct)`; return 200 Ok(result).

3. GET /api/reports/bug-density
   ```csharp
   [HttpGet("bug-density")]
   public async Task<ActionResult<IReadOnlyList<BugDensityItemDto>>>
       GetBugDensity([FromQuery] Guid? projectId, [FromQuery] int days = 30, CancellationToken ct)
   ```
   Validate: if days < 1 || days > 365 → return ValidationProblem("days must be between 1 and 365").
   → Call `_reports.GetBugDensityAsync(projectId, days, ct)`.

4. GET /api/reports/team-performance
   ```csharp
   [HttpGet("team-performance")]
   public async Task<ActionResult<IReadOnlyList<TeamPerformanceItemDto>>>
       GetTeamPerformance([FromQuery] Guid? projectId, [FromQuery] int days = 30, CancellationToken ct)
   ```
   Validate: same `days` range [1, 365].
   → Call `_reports.GetTeamPerformanceAsync(projectId, days, ct)`.

5. GET /api/reports/critical-issues
   ```csharp
   [HttpGet("critical-issues")]
   public async Task<ActionResult<IReadOnlyList<CriticalIssueDto>>>
       GetCriticalIssues([FromQuery] Guid? projectId, [FromQuery] int topN = 10, CancellationToken ct)
   ```
   Validate: if topN < 1 || topN > 50 → return ValidationProblem("topN must be between 1 and 50").
   → Call `_reports.GetCriticalIssuesAsync(projectId, topN, ct)`.

6. GET /api/reports/recommendations
   ```csharp
   [HttpGet("recommendations")]
   public async Task<ActionResult<IReadOnlyList<RecommendationItemDto>>>
       GetRecommendations([FromQuery] Guid? projectId, CancellationToken ct)
   ```
   Implementation: orchestrate internally —
     var dashboard    = await _reports.GetDashboardAsync(projectId, ct);
     var bugDensity   = await _reports.GetBugDensityAsync(projectId, 30, ct);
     var criticalIssues = await _reports.GetCriticalIssuesAsync(projectId, 50, ct);
     var recommendations = _recommendations.GetRecommendations(dashboard, bugDensity, criticalIssues);
     return Ok(recommendations);
   NOTE: Do NOT call _reports.GetRecommendationsAsync — orchestrate here directly to avoid
   double DB trips (the service's own GetRecommendationsAsync also queries). This keeps the
   controller as the single orchestration point for the recommendations endpoint.
   (Alternatively, if the service GetRecommendationsAsync already handles orchestration cleanly,
   delegate to it — prefer whichever avoids redundant queries.)

7. POST /api/reports/export
   ```csharp
   [HttpPost("export")]
   public async Task<IActionResult>
       Export([FromQuery] string format = "csv", [FromQuery] Guid? projectId, CancellationToken ct)
   ```
   - If format is not "csv" (case-insensitive) → return ValidationProblem("Only format=csv is supported.").
   - Gather: dashboard, bugDensity (days=30), teamPerf (days=30), criticalIssues (topN=50).
   - Call `_export.BuildCsvAsync(dashboard, bugDensity, teamPerf, criticalIssues, ct)`.
   - Return: `File(bytes, "text/csv", $"report_{DateOnly.FromDateTime(DateTime.UtcNow)}.csv")`

8. ALL ENDPOINTS return HTTP 200 on success.
   No 204 — reports always return a data shape.
   The controller does NOT call IReportsService.ExportCsvAsync (that method is for internal use).
   The export endpoint orchestrates data gathering + delegates CSV building to IReportExportService.

9. USINGS — Import namespaces for all DTO types from HorusVis.Business.Models.Reports.
   Do NOT add a project reference from Web to Business/Models — Web already references Business.
</requirements>

<output>
Files to modify:
- backend/src/HorusVis.Web/Controllers/ReportsController.cs (fully replaced)
</output>

<verification>
Before declaring complete:
1. Run: cd backend && dotnet build HorusVis.sln
   → Must exit 0 with 0 errors
2. Confirm ReportsController has 6 action methods (GetDashboard, GetBugDensity, GetTeamPerformance,
   GetCriticalIssues, GetRecommendations, Export)
3. Confirm placeholder [HttpGet("placeholder")] endpoint is removed
4. Confirm `days` validation returns ValidationProblem (not throw) for out-of-range
5. Confirm `topN` validation returns ValidationProblem for out-of-range
6. Confirm Export returns File(...) with content-type "text/csv" and dated filename
7. Confirm [Authorize] attribute is present on the controller class
</verification>

<summary_requirements>
Create `.prompts/017-reports-be-controller-do/SUMMARY.md`

Template:
# Reports BE Controller — SUMMARY
**{one-liner}**

## Version
v1

## Key Findings
- {endpoints implemented}
- {validation strategy used}
- {recommendations orchestration approach}

## Files Created
- list all created/modified files

## Decisions Needed
- Auth header on CSV export POST: Bearer from Zustand store? confirm before 018.

## Blockers
{build errors if any, or None}

## Next Step
Run Phase 4: `018-reports-fe-api-do.md`
</summary_requirements>

<success_criteria>
- ReportsController.cs has 6 action methods replacing the placeholder
- [Authorize] on controller class
- days validated [1,365] on bug-density and team-performance endpoints
- topN validated [1,50] on critical-issues endpoint
- Export endpoint: format validation, data orchestration, File(bytes,"text/csv",filename)
- Placeholder endpoint removed
- `dotnet build HorusVis.sln` passes with 0 errors
- SUMMARY.md created at .prompts/017-reports-be-controller-do/SUMMARY.md
</success_criteria>
