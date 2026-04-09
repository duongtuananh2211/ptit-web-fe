# Sprint Backend — Implementation Plan

**One-liner:** Two-phase plan delivering read-only Sprint queries (6 methods, 6 endpoints) in Phase 1 and sprint-item assignment mutations (4 methods, 4 endpoints) in Phase 2, building on the already-seeded Sprint entity + AddSprint migration.

**Version:** v1
**Date:** 2026-04-09

---

## Key Findings

- Sprint entity is complete: `Id`, `SprintCode` (max 20, unique), `StartDate`, `DateOnly`, `EndDate`, `DateOnly`, `Goal?`. No status field — "current" is always computed at query time.
- `WorkTask.SprintId` and `Issue.SprintId` are already nullable FKs with `SetNull` delete — no schema work required.
- `Issue` has a direct `CurrentAssigneeUserId` FK; `WorkTask` uses a `TaskAssignee` join table with `AssignmentType` (`Primary` | `Collaborator` | `Watcher`).
- `ServiceCollectionExtensions.AddHorusVisBusiness()` follows a simple `AddScoped<I, S>()` pattern — one line added.
- `ProjectsController` uses primary constructor injection and a private `GetCallerId()` helper — both patterns are reused in `SprintsController`.
- Sprint is **global** — the board returns tasks/issues from all projects assigned to that sprint.
- Backlog is **per-project** scope filtered on `SprintId == null`.
- Auth for assignment: active `ProjectMember` check via `dbContext.Set<ProjectMember>().AnyAsync(...)`.

---

## Decisions Needed

| # | Question | Default if unconfirmed |
|---|----------|----------------------|
| 1 | `FeatureArea` property name for display: `Name` or `AreaName`? | Use `Name`; verify before executing Phase 1 Do |
| 2 | `User.FullName` — is this the correct display field? | Assume `FullName`; verify against User entity |
| 3 | `MemberStatus.Active` — exact enum value? | Assume `Active`; verify against enum file |
| 4 | Board scope: show all projects' tasks, or only caller's projects? | All projects (Sprint is global) |
| 5 | Backlog caller auth: active member required, or any authenticated user? | Active member required |

---

## Blockers

**None.** Entity, migration, and seeded data are all in place. All blocking infrastructure work is complete.

---

## Phases at a Glance

### Phase 1 — `027-sprint-be-phase1-do`
- **Creates:** 8 DTO files + `ISprintsService` interface + `SprintsService` implementation + `SprintsController` (read-only)
- **Modifies:** `ServiceCollectionExtensions.cs` (1 line) + `ProjectsController.cs` (inject `ISprintsService`, add backlog endpoint)
- **New endpoints:** 5 on SprintsController + 1 backlog on ProjectsController
- **Risk:** Low — all read-only, no data mutation

### Phase 2 — `028-sprint-be-phase2-do`
- **Modifies:** `ISprintsService` (add 4 methods) + `SprintsService` (implement 4 methods) + `SprintsController` (add 4 endpoints)
- **New endpoints:** 4 mutation endpoints (POST/DELETE)
- **Risk:** Low — mutations are simple FK set/null with member auth guard

---

## File Checklist

### Phase 1 — Create
- [ ] `HorusVis.Business/Models/Sprints/SprintDto.cs`
- [ ] `HorusVis.Business/Models/Sprints/SprintBoardTaskItem.cs`
- [ ] `HorusVis.Business/Models/Sprints/SprintBoardIssueItem.cs`
- [ ] `HorusVis.Business/Models/Sprints/SprintBoardColumn.cs`
- [ ] `HorusVis.Business/Models/Sprints/SprintBoardDto.cs`
- [ ] `HorusVis.Business/Models/Sprints/BacklogDto.cs`
- [ ] `HorusVis.Business/Models/Sprints/BacklogTaskItem.cs`
- [ ] `HorusVis.Business/Models/Sprints/BacklogIssueItem.cs`
- [ ] `HorusVis.Business/Contracts/ISprintsService.cs`
- [ ] `HorusVis.Business/Services/SprintsService.cs`
- [ ] `HorusVis.Web/Controllers/SprintsController.cs`

### Phase 1 — Modify
- [ ] `HorusVis.Business/ServiceCollectionExtensions.cs`
- [ ] `HorusVis.Web/Controllers/ProjectsController.cs`

### Phase 2 — Modify
- [ ] `HorusVis.Business/Contracts/ISprintsService.cs`
- [ ] `HorusVis.Business/Services/SprintsService.cs`
- [ ] `HorusVis.Web/Controllers/SprintsController.cs`

---

## Next Step

Execute Do prompt **`027-sprint-be-phase1-do`**, then **`028-sprint-be-phase2-do`**.
