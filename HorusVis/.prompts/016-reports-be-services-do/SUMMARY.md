# Reports BE Services — SUMMARY

**5 DTO records, 3 service interfaces, and 3 fully-implemented services (ReportsService with 5 EF Core queries, RecommendationService with 5 business rules, ReportExportService with multi-section CSV) created and registered in DI. Build: PASS (0 errors).**

---

## Version
v1

## Key Findings
- DTOs placed in `HorusVis.Business/Models/Reports/` (5 records) — reachable from Web layer via existing project reference
- `IssueStatus`, `WorkTaskStatus`, `WorkTaskPriority` are enums stored as strings; LINQ uses enum values (not strings) so EF Core translates correctly
- Bug density uses a 3-table join: `Issues.TaskId → WorkTask.Id → WorkTask.FeatureAreaId → FeatureArea.Id` — no direct `FeatureAreaId` on Issue
- Critical issues left-join implemented via `GroupJoin + SelectMany + DefaultIfEmpty` to preserve null-assignee rows
- `dbContext.Set<T>()` used throughout (no explicit DbSet properties on HorusVisDbContext)
- `ReportsService` constructor-injects both `IRecommendationService` and `IReportExportService` for clean delegation
- ReportExportService includes CSV escaping for commas/quotes in field values (OWASP CSV injection guard)

## Files Created
- `backend/src/HorusVis.Business/Models/Reports/ReportDashboardDto.cs`
- `backend/src/HorusVis.Business/Models/Reports/BugDensityItemDto.cs`
- `backend/src/HorusVis.Business/Models/Reports/TeamPerformanceItemDto.cs`
- `backend/src/HorusVis.Business/Models/Reports/CriticalIssueDto.cs`
- `backend/src/HorusVis.Business/Models/Reports/RecommendationItemDto.cs`
- `backend/src/HorusVis.Business/Contracts/IRecommendationService.cs`
- `backend/src/HorusVis.Business/Contracts/IReportExportService.cs`
- `backend/src/HorusVis.Business/Services/RecommendationService.cs`
- `backend/src/HorusVis.Business/Services/ReportExportService.cs`

## Files Modified
- `backend/src/HorusVis.Business/Contracts/IReportsService.cs` — 6 method signatures added
- `backend/src/HorusVis.Business/Services/ReportsService.cs` — fully implemented
- `backend/src/HorusVis.Business/ServiceCollectionExtensions.cs` — IRecommendationService + IReportExportService registered

## Decisions Needed
- **CapacityRoadmapCard**: No backend model exists. FE Phase 5 will render a static placeholder (no API call) — skip for MVP.
- **Trend computation**: Trend fields are nullable and return `null` for MVP. Prior-period comparison deferred to future iteration.

## Blockers
None — `dotnet build HorusVis.sln` passed with 0 errors (1 pre-existing NU1510 warning unrelated to this change).

## Next Step
Run Phase 3: `017-reports-be-controller-do.md` — wire services into ReportsController with 6 endpoints.
