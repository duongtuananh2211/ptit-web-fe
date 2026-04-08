<objective>
Implement Reports Backend Phase 1+2: define all response DTOs, create service interfaces
(IReportsService, IRecommendationService, IReportExportService), and write full service
implementations (ReportsService with 5 EF Core queries, RecommendationService with 5
rule-based recommendations, ReportExportService for CSV). Register new services in DI.

Purpose: Establishes the complete backend data layer for the Reports feature — all type
definitions, query logic, recommendation rules, and CSV export — before the controller
wires it to HTTP in Phase 3.
Output: ~12 new/modified C# files in HorusVis.Business; project builds with 0 CS errors.
</objective>

<context>
Detailed phase plan (Phases 1–2):
@.prompts/011-reports-plan/reports-plan.md

Task specification and FE/BE checklist:
@docs/outlines/tasks/04-reports/README.md

Current service scaffolds (read before editing):
@backend/src/HorusVis.Business/Contracts/IReportsService.cs
@backend/src/HorusVis.Business/Services/ReportsService.cs
@backend/src/HorusVis.Business/ServiceCollectionExtensions.cs

Existing Business contract examples (for namespace/style reference):
@backend/src/HorusVis.Business/Contracts/IMyTasksService.cs
@backend/src/HorusVis.Business/Services/MyTasksService.cs
</context>

<requirements>
1. DTO FILES — Create directory `backend/src/HorusVis.Business/Models/Reports/` and add five files:

   **ReportDashboardDto.cs** — namespace `HorusVis.Business.Models.Reports`
   ```csharp
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
   ```

   **BugDensityItemDto.cs**
   ```csharp
   public sealed record BugDensityItemDto(
       string  FeatureArea,
       int     OpenCount,
       int     ResolvedCount,
       double? AvgTimeToCloseHours
   );
   ```

   **TeamPerformanceItemDto.cs**
   ```csharp
   public sealed record TeamPerformanceItemDto(
       Guid    UserId,
       string  FullName,
       string? AvatarUrl,
       int     TasksCompleted,
       decimal TotalPoints
   );
   ```

   **CriticalIssueDto.cs**
   ```csharp
   public sealed record CriticalIssueDto(
       Guid           Id,
       string         IssueCode,
       string         Title,
       string         Priority,
       string         Severity,
       string         Status,
       string?        AssigneeName,
       DateTimeOffset OpenedAt,
       DateOnly?      DueDate
   );
   ```

   **RecommendationItemDto.cs**
   ```csharp
   public sealed record RecommendationItemDto(
       string RuleKey,
       string Title,
       string Detail
   );
   ```

2. UPDATE IReportsService.cs — Replace the empty interface body:
   ```csharp
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
   ```

3. CREATE IRecommendationService.cs at `backend/src/HorusVis.Business/Contracts/IRecommendationService.cs`:
   ```csharp
   using HorusVis.Business.Models.Reports;

   namespace HorusVis.Business.Contracts;

   public interface IRecommendationService
   {
       IReadOnlyList<RecommendationItemDto> GetRecommendations(
           ReportDashboardDto dashboard,
           IReadOnlyList<BugDensityItemDto> bugDensity,
           IReadOnlyList<CriticalIssueDto> criticalIssues);
   }
   ```

4. CREATE IReportExportService.cs at `backend/src/HorusVis.Business/Contracts/IReportExportService.cs`:
   ```csharp
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
   ```

5. IMPLEMENT ReportsService.cs — Replace scaffold at
   `backend/src/HorusVis.Business/Services/ReportsService.cs` with full implementation.
   Inject `HorusVisDbContext` directly (DAO pattern matches existing services).

   GetDashboardAsync:
   - TotalActiveBugs: count Issues where Status != "Closed" (+ optional projectId filter)
   - AvgTimeToCloseHours: average (ClosedAt - OpenedAt).TotalHours for issues closed in last 30 days
   - TaskVelocityPoints: sum of PlanEstimate for Tasks with Status == "Done" and UpdatedAt >= 30 days ago
   - CriticalPriorityCount: count Issues where Priority == "Critical" and Status != "Closed"
   - All Trend fields: return null (MVP)

   GetBugDensityAsync:
   CRITICAL — Issues has NO direct FeatureAreaId. Join path:
     Issues.TaskId → Tasks.FeatureAreaId → FeatureAreas.AreaName
   Issues with null TaskId are excluded.
   Use explicit scalar-FK Join() before GroupBy() to avoid EF nav-property client-eval warnings.
   See plan for full LINQ snippet.

   GetTeamPerformanceAsync:
   Join: Tasks (Done, within window) → TaskAssignees (TaskId) → Users (UserId)
   GroupBy user; project TasksCompleted + sum(PlanEstimate).

   GetCriticalIssuesAsync:
   Order by priority weight (Critical=0, High=1, Medium=2, Low=3) then by OpenedAt asc, take topN.
   LEFT JOIN Users on CurrentAssigneeUserId — issues with null assignee must still appear
   (AssigneeName = null). Use GroupJoin + SelectMany + DefaultIfEmpty if EF Core cannot translate
   a straight inner-join .Join() with nullable FK.

   GetRecommendationsAsync:
   Call GetDashboardAsync, GetBugDensityAsync(days=30), GetCriticalIssuesAsync(topN=50),
   then delegate to IRecommendationService.GetRecommendations(...) and return result.
   NOTE: IRecommendationService must be injected (constructor).

   ExportCsvAsync:
   Gather all data (dashboard + bug-density + team-perf + critical-issues),
   delegate to IReportExportService.BuildCsvAsync(...) and return bytes.
   NOTE: IReportExportService must be injected (constructor).

6. CREATE RecommendationService.cs at
   `backend/src/HorusVis.Business/Services/RecommendationService.cs`:

   Rules evaluated in order (return empty list if no rule fires):
   | RuleKey             | Condition                                          | Title / Detail |
   |---------------------|---------------------------------------------------|----------------|
   | HIGH_BUG_DENSITY    | Any FeatureArea has OpenCount >= 5                | "High bug density in {area}" / "Feature area '{area}' has {n} open bugs." |
   | SLOW_RESOLUTION     | AvgTimeToCloseHours >= 72                         | "Bug resolution is slow" / "Average time to close is {h:F0}h (threshold: 72h)." |
   | CRITICAL_BACKLOG    | CriticalPriorityCount >= 3                        | "{n} critical issues are unresolved" / "{n} critical-priority bugs remain open." |
   | LOW_VELOCITY        | TaskVelocityPoints < 5                            | "Task velocity is below threshold" / "Only {pts} points completed in the last 30 days." |
   | UNASSIGNED_CRITICAL | Any open Critical issue has AssigneeName == null  | "Unassigned critical issue: {code}" / "Critical issue {code} — '{title}' has no assignee." |

   Return list ordered by insertion order (HIGH_BUG_DENSITY first, UNASSIGNED_CRITICAL last).

7. CREATE ReportExportService.cs at
   `backend/src/HorusVis.Business/Services/ReportExportService.cs`:

   BuildCsvAsync uses StringBuilder (no external library):
   ```
   Section,Metric,Value
   KPI,TotalActiveBugs,{n}
   KPI,AvgTimeToCloseHours,{h:F1}
   KPI,TaskVelocityPoints,{pts}
   KPI,CriticalPriorityCount,{n}
   (blank line)
   BugDensity,FeatureArea,OpenCount,ResolvedCount,AvgTimeToCloseHours
   BugDensity,{area},{open},{resolved},{avg:F1}
   (blank line)
   TeamPerformance,UserId,FullName,TasksCompleted,TotalPoints
   TeamPerformance,{id},{name},{tasks},{pts}
   (blank line)
   CriticalIssues,IssueCode,Title,Priority,Severity,Status,AssigneeName,OpenedAt
   CriticalIssues,{code},{title},{priority},{severity},{status},{assignee},{openedAt:O}
   ```
   Return Encoding.UTF8.GetBytes(sb.ToString()).
   Method can be synchronous internally; the async signature allows future I/O extension.

8. UPDATE ServiceCollectionExtensions.cs — Add registrations after IReportsService:
   ```csharp
   services.AddScoped<IRecommendationService, RecommendationService>();
   services.AddScoped<IReportExportService, ReportExportService>();
   ```
   IReportsService is ALREADY registered — do NOT duplicate it.
</requirements>

<output>
Files to create:
- backend/src/HorusVis.Business/Models/Reports/ReportDashboardDto.cs
- backend/src/HorusVis.Business/Models/Reports/BugDensityItemDto.cs
- backend/src/HorusVis.Business/Models/Reports/TeamPerformanceItemDto.cs
- backend/src/HorusVis.Business/Models/Reports/CriticalIssueDto.cs
- backend/src/HorusVis.Business/Models/Reports/RecommendationItemDto.cs
- backend/src/HorusVis.Business/Contracts/IRecommendationService.cs
- backend/src/HorusVis.Business/Contracts/IReportExportService.cs
- backend/src/HorusVis.Business/Services/RecommendationService.cs
- backend/src/HorusVis.Business/Services/ReportExportService.cs

Files to modify:
- backend/src/HorusVis.Business/Contracts/IReportsService.cs
- backend/src/HorusVis.Business/Services/ReportsService.cs
- backend/src/HorusVis.Business/ServiceCollectionExtensions.cs
</output>

<verification>
Before declaring complete:
1. Run: cd backend && dotnet build HorusVis.sln
   → Must exit 0 with 0 errors (warnings are acceptable)
2. Confirm IReportsService.cs has all 6 method signatures
3. Confirm ReportsService implements all 6 methods with real EF Core queries
4. Confirm Bug Density join uses the 3-table join (Issues → Tasks → FeatureAreas), NOT a direct FK
5. Confirm Critical Issues query uses left-join semantics (null assignee rows included)
6. Confirm GetRecommendationsAsync delegates to IRecommendationService (injected via constructor)
7. Confirm ExportCsvAsync delegates to IReportExportService (injected via constructor)
8. Confirm ServiceCollectionExtensions registers IRecommendationService + IReportExportService
</verification>

<summary_requirements>
Create `.prompts/016-reports-be-services-do/SUMMARY.md`

Template:
# Reports BE Services — SUMMARY
**{one-liner}**

## Version
v1

## Key Findings
- {DTOs created}
- {services implemented}
- {notable EF Core patterns used}

## Files Created
- list all created/modified files

## Decisions Needed
- CapacityRoadmapCard: skip for MVP or derive from ProjectMembers count?
- Trend computation (prior-period comparison): implement now or leave nullable?

## Blockers
{build errors if any, or None}

## Next Step
Run Phase 3: `017-reports-be-controller-do.md`
</summary_requirements>

<success_criteria>
- All 5 DTO records created under HorusVis.Business/Models/Reports/
- IReportsService updated with 6 method signatures
- IRecommendationService and IReportExportService created
- ReportsService.GetDashboardAsync: 4 separate DB queries, trend fields null
- ReportsService.GetBugDensityAsync: 3-table join (Issues→Tasks→FeatureAreas), no direct FK
- ReportsService.GetCriticalIssuesAsync: left-join semantics for null assignee
- ReportsService.GetRecommendationsAsync: delegates to injected IRecommendationService
- ReportsService.ExportCsvAsync: delegates to injected IReportExportService
- RecommendationService implements all 5 rules
- ReportExportService produces multi-section CSV with UTF-8 bytes
- ServiceCollectionExtensions registers IRecommendationService + IReportExportService
- `dotnet build HorusVis.sln` passes with 0 errors
- SUMMARY.md created at .prompts/016-reports-be-services-do/SUMMARY.md
</success_criteria>
