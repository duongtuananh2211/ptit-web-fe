# Sprint Research Summary

## One-liner
Add a project-scoped `Sprint` entity (7× 2-week sprints per fiscal quarter, Q1 starts April 1) with nullable `SprintId` FKs on `WorkTask` and `Issue`, a new `SprintStatus` enum stored as string, one EF Core migration, and a `SprintsController` with 10 endpoints.

---

## Key Findings

- **Fiscal quarters start April 1.** `2026Q1-1` = April 1–14 2026. Q4 of this convention falls in January (labeled `2027Q4`).
- **Sprint generation algorithm** is deterministic: `startDate = quarterStart + (N-1)*14`, endDate = `startDate + 13`. 7 sprints = 98 days; the last (IP) sprint overflows the calendar quarter by ~7 days.
- **`SprintStatus` enum** needs 4 values: `Planning`, `Active`, `Completed`, `Cancelled`. Must be registered in `HorusVisDbContext.ConfigureConventions`.
- **FK strategy: Option A** (nullable `SprintId` on `WorkTask` and `Issue` with `DeleteBehavior.SetNull`) perfectly matches existing patterns (`Issue.TaskId?`, `WorkTask.FeatureAreaId?`). No join-table needed.
- **3 existing migrations** as of today: `InitialCreate`, `SeedAdminUser`, `AddRoleIsSystem`. New migration is `AddSprint` (creates `Sprints` table + adds `SprintId` nullable FK to `Tasks` and `Issues`).
- **Velocity hook:** `GetProjectOverviewAsync` today uses a rolling 21-day window. Post-Sprint, it should fallback to that window until a sprint completes, then switch to average story-points of the last 3 completed sprints.
- **`Sprint` belongs to a `Project`** (unique index on `(ProjectId, SprintCode)`). Cross-project sprints are out of scope.
- **10 API endpoints** needed: 6 CRUD + 2 task-assignment + 2 issue-assignment. Plus a `/generate` bulk-create endpoint and `/active` convenience endpoint (12 total).

---

## Decisions Needed (user input required)

| # | Question | Options |
|---|----------|---------|
| 1 | IP sprint overflow policy | **A:** Allow 14-day IP sprint to overflow ~7 days into next quarter (uniform sprints) vs **B:** Clip IP sprint to exact quarter-end date (shorter last sprint) |
| 2 | One Active sprint per project? | Enforce at service layer (reject second activation) vs. allow multiple active sprints per project |
| 3 | Q4 year label | January 2027 = `2027Q4` (year of period start) — confirm this is intended |
| 4 | Tasks without `PlanEstimate` in velocity | Exclude from story-point average vs. count as 0 points |

---

## Blockers

None — all entities and migrations are clearly defined. Implementation can proceed after decisions above are made.

---

## Next Step

Create a **Plan prompt** (`.prompts/026-sprint-plan/`) that uses this research to produce:
1. `HorusVis.Data/Enums/SprintStatus.cs`
2. `HorusVis.Data/Horusvis/Entities/Sprint.cs`
3. Edits to `WorkTask.cs` and `Issue.cs` (add `SprintId?`)
4. Edit to `HorusVisDbContext.cs` (register `SprintStatus`)
5. `dotnet ef migrations add AddSprint` command
6. `HorusVis.Business/Contracts/ISprintsService.cs` + implementation
7. `HorusVis.Web/Controllers/SprintsController.cs`
