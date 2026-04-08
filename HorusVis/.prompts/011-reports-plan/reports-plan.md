<?xml version="1.0" encoding="utf-8"?>
<plan>
  <summary>
    Implement the Reports page end-to-end for HorusVis: 4 KPI cards, Bug Density BarChart, Team
    Performance BarChart, Critical Issues list, rule-based Recommendation panel, and CSV export.
    All data is aggregated on-demand (no ReportSnapshots writes). Polling via TanStack Query
    staleTime 5 min. No WebSocket, no PDF, no ML.
  </summary>

  <phases>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <phase number="1" name="Backend — DTOs and Service Interface">
      <objective>
        Define the full data-contract surface (response DTOs + service interface methods) so that
        Phases 2 and 3 can be implemented independently without revisiting type shapes.
      </objective>

      <tasks>
        <task priority="high">
          Create directory `backend/src/HorusVis.Web/Contracts/Reports/` and add five DTO files:

          **ReportDashboardDto.cs**
          ```csharp
          namespace HorusVis.Web.Contracts.Reports;
          public sealed record ReportDashboardDto(
              int     TotalActiveBugs,
              double? AvgTimeToCloseHours,
              decimal TaskVelocityPoints,   // sum of PlanEstimate for Done tasks last 30 d
              int     CriticalPriorityCount,
              double? TotalActiveBugsTrend,  // nullable – pct change vs prior 30 d (can be null MVP)
              double? AvgTimeToCloseTrend,
              double? TaskVelocityTrend,
              double? CriticalPriorityTrend
          );
          ```

          **BugDensityItemDto.cs**
          ```csharp
          namespace HorusVis.Web.Contracts.Reports;
          public sealed record BugDensityItemDto(
              string  FeatureArea,
              int     OpenCount,
              int     ResolvedCount,
              double? AvgTimeToCloseHours
          );
          ```

          **TeamPerformanceItemDto.cs**
          ```csharp
          namespace HorusVis.Web.Contracts.Reports;
          public sealed record TeamPerformanceItemDto(
              Guid    UserId,
              string  FullName,
              string? AvatarUrl,
              int     TasksCompleted,
              decimal TotalPoints       // sum of PlanEstimate for completed tasks
          );
          ```

          **CriticalIssueDto.cs**
          ```csharp
          namespace HorusVis.Web.Contracts.Reports;
          public sealed record CriticalIssueDto(
              Guid    Id,
              string  IssueCode,
              string  Title,
              string  Priority,
              string  Severity,
              string  Status,
              string? AssigneeName,
              DateTimeOffset OpenedAt,
              DateOnly?      DueDate
          );
          ```

          **RecommendationItemDto.cs**
          ```csharp
          namespace HorusVis.Web.Contracts.Reports;
          public sealed record RecommendationItemDto(
              string RuleKey,    // e.g. "HIGH_BUG_DENSITY"
              string Title,
              string Detail
          );
          ```
        </task>

        <task priority="high">
          Update `backend/src/HorusVis.Business/Contracts/IReportsService.cs`:
          ```csharp
          using HorusVis.Web.Contracts.Reports;

          namespace HorusVis.Business.Contracts;

          public interface IReportsService
          {
              Task&lt;ReportDashboardDto&gt;             GetDashboardAsync(Guid? projectId, CancellationToken ct);
              Task&lt;IReadOnlyList&lt;BugDensityItemDto&gt;&gt;      GetBugDensityAsync(Guid? projectId, int days, CancellationToken ct);
              Task&lt;IReadOnlyList&lt;TeamPerformanceItemDto&gt;&gt; GetTeamPerformanceAsync(Guid? projectId, int days, CancellationToken ct);
              Task&lt;IReadOnlyList&lt;CriticalIssueDto&gt;&gt;      GetCriticalIssuesAsync(Guid? projectId, int topN, CancellationToken ct);
              Task&lt;IReadOnlyList&lt;RecommendationItemDto&gt;&gt; GetRecommendationsAsync(Guid? projectId, CancellationToken ct);
              Task&lt;byte[]&gt;                            ExportCsvAsync(Guid? projectId, CancellationToken ct);
          }
          ```
        </task>

        <task priority="medium">
          Add a project reference from `HorusVis.Business` to `HorusVis.Web` is NOT appropriate
          (circular). Instead, move the five DTO files to
          `backend/src/HorusVis.Business/Models/Reports/` under namespace
          `HorusVis.Business.Models.Reports` and update the service interface accordingly.
          `HorusVis.Web` already references `HorusVis.Business`, so the DTOs will be reachable
          from the controller.
        </task>
      </tasks>

      <deliverables>
        <deliverable>`backend/src/HorusVis.Business/Models/Reports/ReportDashboardDto.cs`</deliverable>
        <deliverable>`backend/src/HorusVis.Business/Models/Reports/BugDensityItemDto.cs`</deliverable>
        <deliverable>`backend/src/HorusVis.Business/Models/Reports/TeamPerformanceItemDto.cs`</deliverable>
        <deliverable>`backend/src/HorusVis.Business/Models/Reports/CriticalIssueDto.cs`</deliverable>
        <deliverable>`backend/src/HorusVis.Business/Models/Reports/RecommendationItemDto.cs`</deliverable>
        <deliverable>`backend/src/HorusVis.Business/Contracts/IReportsService.cs` (updated)</deliverable>
      </deliverables>

      <dependencies>None — pure type definitions.</dependencies>
    </phase>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <phase number="2" name="Backend — Service Implementations">
      <objective>
        Implement `ReportsService` (query logic), `RecommendationService` (rule-based text),
        and `ReportExportService` (CSV builder). Register all three in DI.
        All queries are on-demand aggregations; the `ReportSnapshots` table is NOT written.
      </objective>

      <tasks>
        <task priority="high">
          Implement `ReportsService.GetDashboardAsync` in
          `backend/src/HorusVis.Business/Services/ReportsService.cs`.

          Inject `HorusVisDbContext` directly (DAO pattern already established).

          ```csharp
          // TotalActiveBugs
          var activeBugs = await dbContext.Issues
              .Where(i => i.Status != "Closed" &amp;&amp; (projectId == null || i.ProjectId == projectId))
              .CountAsync(ct);

          // AvgTimeToCloseHours (issues closed in last 30 days)
          var since = DateTimeOffset.UtcNow.AddDays(-30);
          var avgClose = await dbContext.Issues
              .Where(i => i.ClosedAt.HasValue &amp;&amp; i.ClosedAt >= since
                          &amp;&amp; (projectId == null || i.ProjectId == projectId))
              .AverageAsync(i => (double?)(i.ClosedAt!.Value - i.OpenedAt).TotalHours, ct);

          // TaskVelocityPoints — sum of PlanEstimate for Done tasks last 30 d
          var velocity = await dbContext.Tasks
              .Where(t => t.Status == "Done" &amp;&amp; t.UpdatedAt >= since
                          &amp;&amp; (projectId == null || t.ProjectId == projectId))
              .SumAsync(t => t.PlanEstimate ?? 0, ct);

          // CriticalPriorityCount
          var critCount = await dbContext.Issues
              .Where(i => i.Priority == "Critical" &amp;&amp; i.Status != "Closed"
                          &amp;&amp; (projectId == null || i.ProjectId == projectId))
              .CountAsync(ct);
          ```
          Trend fields set to `null` for MVP.
        </task>

        <task priority="high">
          Implement `ReportsService.GetBugDensityAsync`.

          **Critical data-model note**: The `Issues` table has NO `FeatureAreaId` column.
          The join path is: `Issues.TaskId → Tasks.FeatureAreaId → FeatureAreas.AreaName`.
          Issues where `TaskId IS NULL` are excluded (can't attribute to a feature area).

          ```csharp
          var since = DateTimeOffset.UtcNow.AddDays(-days);

          var bugDensity = await dbContext.Issues
              .Where(i => i.TaskId.HasValue
                          &amp;&amp; (projectId == null || i.ProjectId == projectId))
              .Join(dbContext.Tasks,
                    i  => i.TaskId,
                    t  => (Guid?)t.Id,
                    (i, t) => new { i, t.FeatureAreaId })
              .Where(x => x.FeatureAreaId.HasValue)
              .Join(dbContext.FeatureAreas,
                    x  => x.FeatureAreaId,
                    fa => (Guid?)fa.Id,
                    (x, fa) => new { x.i, AreaName = fa.AreaName })
              .GroupBy(x => x.AreaName)
              .Select(g => new BugDensityItemDto(
                  g.Key,
                  g.Count(x => x.i.Status != "Closed"),
                  g.Count(x => x.i.Status == "Closed"),
                  g.Where(x => x.i.ClosedAt.HasValue)
                   .Average(x => (double?)(x.i.ClosedAt!.Value - x.i.OpenedAt).TotalHours)
              ))
              .ToListAsync(ct);
          ```
        </task>

        <task priority="high">
          Implement `ReportsService.GetTeamPerformanceAsync`.

          Join Tasks (Status = "Done", UpdatedAt in window) → TaskAssignees (to get users).

          ```csharp
          var since = DateTimeOffset.UtcNow.AddDays(-days);

          var perf = await dbContext.Tasks
              .Where(t => t.Status == "Done" &amp;&amp; t.UpdatedAt >= since
                          &amp;&amp; (projectId == null || t.ProjectId == projectId))
              .Join(dbContext.TaskAssignees,
                    t  => t.Id,
                    ta => ta.TaskId,
                    (t, ta) => new { t, ta.UserId })
              .Join(dbContext.Users,
                    x  => x.UserId,
                    u  => u.Id,
                    (x, u) => new { x.t, u })
              .GroupBy(x => new { x.u.Id, x.u.FullName, x.u.AvatarUrl })
              .Select(g => new TeamPerformanceItemDto(
                  g.Key.Id,
                  g.Key.FullName,
                  g.Key.AvatarUrl,
                  g.Count(),
                  g.Sum(x => x.t.PlanEstimate ?? 0)
              ))
              .ToListAsync(ct);
          ```
        </task>

        <task priority="high">
          Implement `ReportsService.GetCriticalIssuesAsync`.

          Return top N open issues ordered by priority weight then by OpenedAt ascending.

          ```csharp
          // Priority ordering: Critical=0, High=1, Medium=2, Low=3
          var issues = await dbContext.Issues
              .Where(i => i.Status != "Closed"
                          &amp;&amp; (projectId == null || i.ProjectId == projectId))
              .OrderBy(i => i.Priority == "Critical" ? 0
                          : i.Priority == "High"     ? 1
                          : i.Priority == "Medium"   ? 2 : 3)
              .ThenBy(i => i.OpenedAt)
              .Take(topN)
              .Join(dbContext.Users,
                    i => i.CurrentAssigneeUserId,
                    u => (Guid?)u.Id,
                    (i, u) => new CriticalIssueDto(
                        i.Id, i.IssueCode, i.Title, i.Priority, i.Severity,
                        i.Status, u.FullName, i.OpenedAt, i.DueDate))
              .ToListAsync(ct);
          ```
          Note: Use left-join semantics — issues with null `CurrentAssigneeUserId` must still appear
          with `AssigneeName = null`. Use `.GroupJoin` + `.SelectMany` with `DefaultIfEmpty` if EF
          Core doesn't translate the above left-join correctly.
        </task>

        <task priority="medium">
          Create `backend/src/HorusVis.Business/Services/RecommendationService.cs` implementing
          `IRecommendationService` (new interface at `Contracts/IRecommendationService.cs`).

          Rules evaluated in order:
          | RuleKey               | Condition                                             | Title template |
          |-----------------------|-------------------------------------------------------|----------------|
          | HIGH_BUG_DENSITY      | Any FeatureArea has OpenCount ≥ 5                     | "High bug density in {area}" |
          | SLOW_RESOLUTION       | AvgTimeToCloseHours ≥ 72                              | "Bug resolution is slow ({h:.0}h avg)" |
          | CRITICAL_BACKLOG      | CriticalPriorityCount ≥ 3                             | "{n} critical issues are unresolved" |
          | LOW_VELOCITY          | TaskVelocityPoints &lt; 5 (last 30 days)              | "Task velocity is below threshold" |
          | UNASSIGNED_CRITICAL   | Any open Critical issue has null CurrentAssigneeUserId| "Unassigned critical issue: {code}" |

          `GetRecommendationsAsync` accepts the already-computed dashboard + bug-density data
          (passed in, no extra DB hit) and applies the rules, returning a list ordered by severity.
        </task>

        <task priority="medium">
          Create `backend/src/HorusVis.Business/Services/ReportExportService.cs` implementing
          `IReportExportService` (new interface at `Contracts/IReportExportService.cs`).

          ```csharp
          public async Task&lt;byte[]&gt; BuildCsvAsync(
              ReportDashboardDto dashboard,
              IReadOnlyList&lt;BugDensityItemDto&gt; bugDensity,
              IReadOnlyList&lt;TeamPerformanceItemDto&gt; teamPerf,
              IReadOnlyList&lt;CriticalIssueDto&gt; criticalIssues,
              CancellationToken ct)
          {
              var sb = new StringBuilder();
              // Section headers + rows for each dataset
              // KPI section
              sb.AppendLine("Section,Metric,Value");
              sb.AppendLine($"KPI,TotalActiveBugs,{dashboard.TotalActiveBugs}");
              sb.AppendLine($"KPI,AvgTimeToCloseHours,{dashboard.AvgTimeToCloseHours:F1}");
              sb.AppendLine($"KPI,TaskVelocityPoints,{dashboard.TaskVelocityPoints}");
              sb.AppendLine($"KPI,CriticalPriorityCount,{dashboard.CriticalPriorityCount}");
              sb.AppendLine();
              // BugDensity section, TeamPerf section, CriticalIssues section similarly
              return Encoding.UTF8.GetBytes(sb.ToString());
          }
          ```
        </task>

        <task priority="low">
          Register new services in
          `backend/src/HorusVis.Business/ServiceCollectionExtensions.cs`:
          ```csharp
          services.AddScoped&lt;IReportsService, ReportsService&gt;();
          services.AddScoped&lt;IRecommendationService, RecommendationService&gt;();
          services.AddScoped&lt;IReportExportService, ReportExportService&gt;();
          ```
        </task>
      </tasks>

      <deliverables>
        <deliverable>`backend/src/HorusVis.Business/Services/ReportsService.cs` (fully implemented)</deliverable>
        <deliverable>`backend/src/HorusVis.Business/Services/RecommendationService.cs`</deliverable>
        <deliverable>`backend/src/HorusVis.Business/Services/ReportExportService.cs`</deliverable>
        <deliverable>`backend/src/HorusVis.Business/Contracts/IRecommendationService.cs`</deliverable>
        <deliverable>`backend/src/HorusVis.Business/Contracts/IReportExportService.cs`</deliverable>
        <deliverable>`backend/src/HorusVis.Business/ServiceCollectionExtensions.cs` (updated)</deliverable>
      </deliverables>

      <dependencies>Phase 1 (DTOs + IReportsService).</dependencies>
    </phase>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <phase number="3" name="Backend — Controller + API Contracts">
      <objective>
        Wire services into `ReportsController`, implement all 5 endpoints with correct routing,
        authorization, query parameters, and response types. Remove the placeholder endpoint.
      </objective>

      <tasks>
        <task priority="high">
          Replace `backend/src/HorusVis.Web/Controllers/ReportsController.cs` with:

          ```csharp
          [ApiController]
          [Authorize]
          [Route("api/reports")]
          public sealed class ReportsController : ControllerBase
          {
              private readonly IReportsService _reports;
              private readonly IRecommendationService _recommendations;
              private readonly IReportExportService   _export;

              // Constructor injection

              // GET /api/reports/dashboard?projectId={guid}
              [HttpGet("dashboard")]
              public async Task&lt;ActionResult&lt;ReportDashboardDto&gt;&gt;
                  GetDashboard([FromQuery] Guid? projectId, CancellationToken ct)

              // GET /api/reports/bug-density?projectId={guid}&amp;days=30
              [HttpGet("bug-density")]
              public async Task&lt;ActionResult&lt;IReadOnlyList&lt;BugDensityItemDto&gt;&gt;&gt;
                  GetBugDensity([FromQuery] Guid? projectId, [FromQuery] int days = 30, CancellationToken ct)

              // GET /api/reports/team-performance?projectId={guid}&amp;days=30
              [HttpGet("team-performance")]
              public async Task&lt;ActionResult&lt;IReadOnlyList&lt;TeamPerformanceItemDto&gt;&gt;&gt;
                  GetTeamPerformance([FromQuery] Guid? projectId, [FromQuery] int days = 30, CancellationToken ct)

              // GET /api/reports/critical-issues?projectId={guid}&amp;topN=10
              [HttpGet("critical-issues")]
              public async Task&lt;ActionResult&lt;IReadOnlyList&lt;CriticalIssueDto&gt;&gt;&gt;
                  GetCriticalIssues([FromQuery] Guid? projectId, [FromQuery] int topN = 10, CancellationToken ct)

              // GET /api/reports/recommendations?projectId={guid}
              [HttpGet("recommendations")]
              public async Task&lt;ActionResult&lt;IReadOnlyList&lt;RecommendationItemDto&gt;&gt;&gt;
                  GetRecommendations([FromQuery] Guid? projectId, CancellationToken ct)

              // POST /api/reports/export?format=csv
              [HttpPost("export")]
              public async Task&lt;IActionResult&gt; Export([FromQuery] string format = "csv", [FromQuery] Guid? projectId, CancellationToken ct)
              // Returns: File(bytes, "text/csv", $"report_{DateOnly.FromDateTime(DateTime.UtcNow)}.csv")
          }
          ```
          All endpoints return HTTP 200. No HTTP 204 — reports always have a data shape.
        </task>

        <task priority="medium">
          The `recommendations` endpoint orchestrates internally: call
          `IReportsService.GetDashboardAsync` + `GetBugDensityAsync` + `GetCriticalIssuesAsync`,
          then pass results to `IRecommendationService.GetRecommendationsAsync`. Single HTTP round
          trip from the frontend perspective.
        </task>

        <task priority="medium">
          Validate `days` param: clamp to range [1, 365] with a filter or manual check.
          Validate `topN`: clamp to [1, 50].
          Return `ValidationProblem` for out-of-range values.
        </task>
      </tasks>

      <deliverables>
        <deliverable>`backend/src/HorusVis.Web/Controllers/ReportsController.cs` (fully implemented, placeholder removed)</deliverable>
      </deliverables>

      <dependencies>Phase 1 (DTOs), Phase 2 (service implementations).</dependencies>
    </phase>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <phase number="4" name="Frontend — API Layer + TanStack Query Hooks">
      <objective>
        Create the TypeScript API service layer and custom React Query hooks for all 6 report
        endpoints. Establish type-safe contracts so UI components have zero type guessing.
      </objective>

      <tasks>
        <task priority="high">
          Extend `frontend/horusvis-react/src/api/types.ts` with report-specific types:

          ```ts
          // Reports
          export type ReportDashboardDto = {
            totalActiveBugs: number;
            avgTimeToCloseHours: number | null;
            taskVelocityPoints: number;
            criticalPriorityCount: number;
            totalActiveBugsTrend: number | null;
            avgTimeToCloseTrend: number | null;
            taskVelocityTrend: number | null;
            criticalPriorityTrend: number | null;
          };

          export type BugDensityItemDto = {
            featureArea: string;
            openCount: number;
            resolvedCount: number;
            avgTimeToCloseHours: number | null;
          };

          export type TeamPerformanceItemDto = {
            userId: string;
            fullName: string;
            avatarUrl: string | null;
            tasksCompleted: number;
            totalPoints: number;
          };

          export type CriticalIssueDto = {
            id: string;
            issueCode: string;
            title: string;
            priority: string;
            severity: string;
            status: string;
            assigneeName: string | null;
            openedAt: string;     // ISO 8601
            dueDate: string | null; // ISO date
          };

          export type RecommendationItemDto = {
            ruleKey: string;
            title: string;
            detail: string;
          };
          ```
        </task>

        <task priority="high">
          Create `frontend/horusvis-react/src/api/reportsApi.ts`:

          ```ts
          import { apiGet } from "./httpClient";
          import type {
            ReportDashboardDto, BugDensityItemDto,
            TeamPerformanceItemDto, CriticalIssueDto, RecommendationItemDto
          } from "./types";

          const BASE = "/api/reports";

          export function fetchDashboard(projectId?: string) {
            const qs = projectId ? `?projectId=${projectId}` : "";
            return apiGet&lt;ReportDashboardDto&gt;(`${BASE}/dashboard${qs}`);
          }

          export function fetchBugDensity(projectId?: string, days = 30) {
            const qs = new URLSearchParams();
            if (projectId) qs.set("projectId", projectId);
            qs.set("days", String(days));
            return apiGet&lt;BugDensityItemDto[]&gt;(`${BASE}/bug-density?${qs}`);
          }

          export function fetchTeamPerformance(projectId?: string, days = 30) {
            const qs = new URLSearchParams();
            if (projectId) qs.set("projectId", projectId);
            qs.set("days", String(days));
            return apiGet&lt;TeamPerformanceItemDto[]&gt;(`${BASE}/team-performance?${qs}`);
          }

          export function fetchCriticalIssues(projectId?: string, topN = 10) {
            const qs = new URLSearchParams();
            if (projectId) qs.set("projectId", projectId);
            qs.set("topN", String(topN));
            return apiGet&lt;CriticalIssueDto[]&gt;(`${BASE}/critical-issues?${qs}`);
          }

          export function fetchRecommendations(projectId?: string) {
            const qs = projectId ? `?projectId=${projectId}` : "";
            return apiGet&lt;RecommendationItemDto[]&gt;(`${BASE}/recommendations${qs}`);
          }

          // CSV export — not a JSON call; returns a Blob directly
          export async function exportCsv(projectId?: string): Promise&lt;void&gt; {
            const qs = new URLSearchParams({ format: "csv" });
            if (projectId) qs.set("projectId", projectId);
            const res = await fetch(`/api/reports/export?${qs}`, { method: "POST" });
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href     = url;
            a.download = `report_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }
          ```
        </task>

        <task priority="high">
          Create `frontend/horusvis-react/src/hooks/useReports.ts` with TanStack Query v5 hooks:

          ```ts
          import { useQuery, useQueryClient } from "@tanstack/react-query";
          import * as reportsApi from "../api/reportsApi";

          const STALE = 5 * 60_000; // 5 min

          export function useDashboard(projectId?: string) {
            return useQuery({
              queryKey: ["reports", "dashboard", projectId],
              queryFn:  () => reportsApi.fetchDashboard(projectId),
              staleTime: STALE,
            });
          }

          export function useBugDensity(projectId?: string, days = 30) {
            return useQuery({
              queryKey: ["reports", "bug-density", projectId, days],
              queryFn:  () => reportsApi.fetchBugDensity(projectId, days),
              staleTime: STALE,
            });
          }

          export function useTeamPerformance(projectId?: string, days = 30) {
            return useQuery({
              queryKey: ["reports", "team-performance", projectId, days],
              queryFn:  () => reportsApi.fetchTeamPerformance(projectId, days),
              staleTime: STALE,
            });
          }

          export function useCriticalIssues(projectId?: string, topN = 10) {
            return useQuery({
              queryKey: ["reports", "critical-issues", projectId, topN],
              queryFn:  () => reportsApi.fetchCriticalIssues(projectId, topN),
              staleTime: STALE,
            });
          }

          export function useRecommendations(projectId?: string) {
            return useQuery({
              queryKey: ["reports", "recommendations", projectId],
              queryFn:  () => reportsApi.fetchRecommendations(projectId),
              staleTime: STALE,
            });
          }

          // Refresh: invalidates all report query keys
          export function useRefreshReports() {
            const qc = useQueryClient();
            return () => qc.invalidateQueries({ queryKey: ["reports"] });
          }
          ```
        </task>
      </tasks>

      <deliverables>
        <deliverable>`frontend/horusvis-react/src/api/types.ts` (report types appended)</deliverable>
        <deliverable>`frontend/horusvis-react/src/api/reportsApi.ts`</deliverable>
        <deliverable>`frontend/horusvis-react/src/hooks/useReports.ts`</deliverable>
      </deliverables>

      <dependencies>Phase 3 (controller endpoints deployed / accessible).</dependencies>
    </phase>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <phase number="5" name="Frontend — UI Components + ReportsPage">
      <objective>
        Build all report UI components and replace the `ReportsPage` scaffold. All components live
        under `src/components/reports/`. Recharts v3.8 for charts. No WebSocket, no PDF.
      </objective>

      <tasks>
        <task priority="high">
          Replace `frontend/horusvis-react/src/pages/ReportsPage.tsx`:

          ```tsx
          // Orchestrates all report sections; passes projectId from route param or store.
          // Layout: ReportsHeader → KpiCardGrid → 2-col (BugDensityChart | TeamPerformanceChart)
          //          → CriticalIssuesList → RecommendationPanel
          // Uses Suspense boundaries per section with a skeleton fallback.
          ```

          Accept optional `?projectId=` from `useSearchParams()`.
        </task>

        <task priority="high">
          Create `frontend/horusvis-react/src/components/reports/ReportsHeader.tsx`:
          - Title "Reports"
          - Optional subtitle with selected project name
          - `RefreshButton` (calls `useRefreshReports()`)
          - `ExportButton` (calls `reportsApi.exportCsv()`)
          Props: `{ projectId?: string }`
        </task>

        <task priority="high">
          Create `frontend/horusvis-react/src/components/reports/KpiCardGrid.tsx`:
          - CSS Grid 2×2 (responsive: 1 col on mobile, 4 col on xl)
          - Renders 4 `KpiCard` children

          Create `frontend/horusvis-react/src/components/reports/KpiCard.tsx`:
          Props: `{ label: string; value: string | number; trend?: number | null; unit?: string }`
          - Trend indicator: ↑ green if trend > 0 for velocity; ↓ red if trend > 0 for bugs/close-time
          - Trend direction is metric-specific — pass `trendDirection: "higher-is-better" | "lower-is-better"`
          - No sparkline for MVP (future enhancement)
        </task>

        <task priority="high">
          Create `frontend/horusvis-react/src/components/reports/BugDensityChart.tsx`:

          ```tsx
          import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

          // data: BugDensityItemDto[]
          // Maps { featureArea, openCount, resolvedCount } → Recharts data array
          &lt;ResponsiveContainer width="100%" height={300}&gt;
            &lt;BarChart data={data}&gt;
              &lt;XAxis dataKey="featureArea" /&gt;
              &lt;YAxis allowDecimals={false} /&gt;
              &lt;Tooltip /&gt;
              &lt;Legend /&gt;
              &lt;Bar dataKey="openCount"     name="Open"     fill="#ef4444" /&gt;
              &lt;Bar dataKey="resolvedCount" name="Resolved" fill="#10b981" /&gt;
            &lt;/BarChart&gt;
          &lt;/ResponsiveContainer&gt;
          ```
          Empty-state: "No bug data for the selected period" when data is empty.
        </task>

        <task priority="high">
          Create `frontend/horusvis-react/src/components/reports/TeamPerformanceChart.tsx`:

          ```tsx
          // Recharts BarChart — horizontal layout for readability when many users
          // dataKey="totalPoints" (primary bar), dataKey="tasksCompleted" (secondary bar)
          // XAxis: user FullName; YAxis: value
          &lt;BarChart layout="vertical" data={data}&gt;
            &lt;XAxis type="number" allowDecimals={false} /&gt;
            &lt;YAxis dataKey="fullName" type="category" width={120} /&gt;
            &lt;Tooltip /&gt;
            &lt;Bar dataKey="tasksCompleted" name="Tasks Done" fill="#6366f1" /&gt;
            &lt;Bar dataKey="totalPoints"    name="Points"     fill="#f59e0b" /&gt;
          &lt;/BarChart&gt;
          ```
        </task>

        <task priority="high">
          Create `frontend/horusvis-react/src/components/reports/CriticalIssuesList.tsx`:
          - Ordered list, max 10 rows
          - Each row: IssueCode badge | Title | Priority badge (Critical=red, High=orange) | Assignee | DueDate
          - Priority badge color map: `{ Critical: "bg-red-600", High: "bg-orange-500", Medium: "bg-yellow-500", Low: "bg-slate-400" }`
          - Overdue DueDate highlighted in red
        </task>

        <task priority="high">
          Create `frontend/horusvis-react/src/components/reports/RecommendationPanel.tsx`:
          - Renders each `RecommendationItemDto` as a card with icon (warning triangle), title, detail
          - Empty state: "No recommendations — system is healthy" with a green checkmark
        </task>

        <task priority="medium">
          Create `frontend/horusvis-react/src/components/reports/RefreshButton.tsx`:
          - Button with a rotate icon
          - Calls `useRefreshReports()` on click
          - Shows loading spinner while any report query is fetching (`isFetching` from any hook)
        </task>

        <task priority="medium">
          Create `frontend/horusvis-react/src/components/reports/ExportButton.tsx`:
          - Button labelled "Export CSV"
          - Calls `reportsApi.exportCsv(projectId)` on click
          - Disables itself during the async download to prevent double-click
          - Does NOT use TanStack Mutation — plain async handler is sufficient
        </task>

        <task priority="low">
          Install Recharts if not already present:
          ```bash
          cd frontend/horusvis-react &amp;&amp; npm install recharts@^3.8
          ```
          Verify `recharts` appears in `package.json` dependencies before writing import statements.
        </task>
      </tasks>

      <deliverables>
        <deliverable>`frontend/horusvis-react/src/pages/ReportsPage.tsx` (fully implemented)</deliverable>
        <deliverable>`frontend/horusvis-react/src/components/reports/ReportsHeader.tsx`</deliverable>
        <deliverable>`frontend/horusvis-react/src/components/reports/KpiCardGrid.tsx`</deliverable>
        <deliverable>`frontend/horusvis-react/src/components/reports/KpiCard.tsx`</deliverable>
        <deliverable>`frontend/horusvis-react/src/components/reports/BugDensityChart.tsx`</deliverable>
        <deliverable>`frontend/horusvis-react/src/components/reports/TeamPerformanceChart.tsx`</deliverable>
        <deliverable>`frontend/horusvis-react/src/components/reports/CriticalIssuesList.tsx`</deliverable>
        <deliverable>`frontend/horusvis-react/src/components/reports/RecommendationPanel.tsx`</deliverable>
        <deliverable>`frontend/horusvis-react/src/components/reports/RefreshButton.tsx`</deliverable>
        <deliverable>`frontend/horusvis-react/src/components/reports/ExportButton.tsx`</deliverable>
      </deliverables>

      <dependencies>Phase 4 (hooks + API layer).</dependencies>
    </phase>

  </phases>

  <metadata>
    <confidence level="high">
      Schema is fully known from InitialCreate migration. All EF Core join paths verified against
      actual column names. Research decisions (Recharts v3.8, staleTime 5 min, CSV-only export,
      rule-based recommendations, no snapshot writes) are locked in.
    </confidence>

    <dependencies>
      - `recharts@^3.8` must be installed in the React project before Phase 5.
      - `@tanstack/react-query` v5 must already be configured in the app (verify QueryClient
        exists in `main.tsx` or `App.tsx`).
      - `HorusVisDbContext` must expose `DbSet` properties for: Issues, Tasks, TaskAssignees,
        Users, FeatureAreas, Projects. Verify in the DbContext class before implementing Phase 2.
    </dependencies>

    <open_questions>
      1. **CapacityRoadmapCard**: The task spec lists a "Capacity and Roadmap" block but the
         research and planning prompt do not define a data source. Deferred to post-MVP unless
         the implementer decides to derive capacity from `ProjectMembers` count.
      2. **Trend computation**: KPI trend ↑↓ percentages require comparing current 30-day window
         against the previous 30-day window. For MVP, trend fields are nullable and set to null.
         The Do prompt for Phase 2 can add a prior-period comparison if time permits.
      3. **Auth header on export**: `exportCsv()` in Phase 4 uses a raw `fetch()` without the
         auth header. The implementer must add the Bearer token from the auth store to the export
         request, consistent with how `apiGet` handles auth (check `httpClient.ts`).
      4. **Issues without TaskId**: Issues with null TaskId are excluded from bug density by design.
         If the team wants unattributed bugs tracked separately, a future FeatureArea named
         "Unclassified" should be created and assigned.
      5. **CriticalIssuesQuery left-join**: EF Core 10 may not translate the `.Join()` with
         nullable Guid left-join correctly. Fall back to `.GroupJoin().SelectMany(DefaultIfEmpty)`
         if the query throws a translation exception.
    </open_questions>

    <assumptions>
      - Issue priority values in the DB are exactly: "Critical", "High", "Medium", "Low".
      - Task status for completion is exactly: "Done".
      - Issue status for open/closed check is exactly: "Closed" (closed), everything else is open.
      - `Tasks.UpdatedAt` is reliably set when a task transitions to Done (backend enforces this).
      - The frontend already has a working auth token mechanism; `httpClient.ts` already attaches
        Bearer tokens (or will be updated to do so as part of the Auth workstream).
      - Recharts v3.8 tree-shaking works correctly with named imports from "recharts".
      - `CapacityRoadmapCard` is out of scope for this plan (no data model backing it).
    </assumptions>
  </metadata>
</plan>
