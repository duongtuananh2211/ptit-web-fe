# 021 — Projects BE Overview

**Projects overview + board-preview aggregation endpoints complete: 7 DTOs, 2 service methods, 2 controller endpoints**

## Version
v1 — executed April 9, 2026

## Files Created
- `HorusVis.Business/Models/Projects/MilestoneDto.cs`
- `HorusVis.Business/Models/Projects/TeamWorkloadItem.cs`
- `HorusVis.Business/Models/Projects/TaskSummaryDto.cs`
- `HorusVis.Business/Models/Projects/ProjectOverviewDto.cs`
- `HorusVis.Business/Models/Projects/BoardTaskPreviewItem.cs`
- `HorusVis.Business/Models/Projects/BoardColumnDto.cs`
- `HorusVis.Business/Models/Projects/ProjectBoardPreviewDto.cs`

## Files Modified
- `HorusVis.Business/Contracts/IProjectsService.cs` — added `GetProjectOverviewAsync`, `GetBoardPreviewAsync` (7 methods total)
- `HorusVis.Business/Services/ProjectsService.cs` — implemented both new methods
- `HorusVis.Web/Controllers/ProjectsController.cs` — added `GET /api/projects/{id}/overview`, `GET /api/projects/{id}/board-preview` (15 endpoints total)

## Key Findings
- `VelocityScore` = tasks with `Status == Done` in last 21 days divided by 3.0, rounded to 1 decimal
- `NextMilestone` is hardcoded `null` with TODO comment — no Milestones table exists in schema
- `TeamWorkload` joins `WorkTask → TaskAssignee → User`, filters non-Done tasks, groups by user
- `TaskSummary` uses `GroupBy(_ => 1)` + conditional `Count()` — single DB round-trip
- `GetBoardPreviewAsync` produces exactly 4 columns (ToDo, Working, Stuck, Done), top-5 tasks each by priority then CreatedAt
- Board assignee lookup done as separate query per task batch (avoids EF Core client-eval warning on nested subquery)

## Decisions Needed
- Milestones feature: when added, update `GetProjectOverviewAsync` to query `MilestonesTable` instead of returning null

## Blockers
None

## Next Step
021 complete — Projects BE phases done. FE phases (022 → 024) deferred until requested.
