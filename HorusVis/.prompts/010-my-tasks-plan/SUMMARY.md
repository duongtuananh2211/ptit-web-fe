# My Tasks — Implementation Plan Summary

**One-liner**: Build a user-scoped Kanban board with drag-and-drop task management, inline subtask effort editing, issue tracking with a 4-stage workflow stepper, and server-computed task progress across a full React + ASP.NET Core 10 stack.

---

## Phase Breakdown

| # | Phase | Scope | Key Deliverables |
|---|-------|-------|-----------------|
| 1 | **DB Migration** | BE | Add `Tasks.BoardRank` + `Subtasks.SortOrder`; apply migration |
| 2 | **BE Service Layer** | BE | `TasksService`, `IssuesService`, `SubtasksService`, `TaskProgressCalculator`, all DTOs |
| 3 | **BE Controllers** | BE | `TasksController` (replaces scaffold), `IssuesController`, `SubtasksController`, `BusinessRuleException` |
| 4 | **FE Foundation** | FE | Install packages, TanStack Query setup, httpClient auth, `taskTypes.ts`, `tasksApi/issuesApi/subtasksApi` |
| 5 | **FE Kanban Board** | FE | `myTasksStore`, `KanbanBoard`, `KanbanColumn`, `TaskCard`, `TaskFilterBar`, `NewTaskModal` |
| 6 | **FE Detail Views** | FE | `TaskDetailDrawer`, `SubtaskTable`, `SubtaskEffortEditor`, `IssueListPanel`, `IssueDetailPage`, `FixingWorkflowStepper`, `ReportIssueForm` |

---

## Decisions Needed

1. **TaskAssignees.AssignmentType value** — what string identifies the "primary" assignee on a task card? (e.g., `"Primary"`, `"Owner"`)  Needed before `MyTasksService.GetMyBoardAsync` can project `primaryAssignee`.

2. **Access token localStorage key** — what key does Task 01 (auth) use to store the JWT?  Needed before `httpClient.ts` can inject the Bearer header.

3. **Stuck column: user-driven or BE-auto?** — spec mentions both manual drag AND auto-set when a Critical issue is open.  Plan defaults to user-driven.  Confirm before Phase 2.

4. **IssueDetailPage routing** — standalone route (`/issues/:issueId`) or nested within `/my-tasks`?  Plan defaults to standalone.

5. **SubtaskTable "Project" column** — Subtasks have no direct `ProjectId`; the column should display the parent Task's or Issue's project name.  Confirm this expectation.

---

## Blockers

| Blocker | Impact | Resolution |
|---------|--------|------------|
| `Tasks.BoardRank` absent from DB | DnD position cannot be persisted | **Phase 1** — add migration immediately |
| `Subtasks.SortOrder` absent from DB | SubtaskTable row order undefined | **Phase 1** — same migration |
| dnd-kit / TanStack Query not installed | All FE board work blocked | **Phase 4** — `npm install` step |
| `httpClient.ts` has no auth header | All BE calls after Phase 3 return 401 | **Phase 4** — extend httpClient with Bearer token |
| Scaffold `MyTasksController` uses `api/my-tasks` route | Conflicts with planned `api/tasks` | **Phase 3** — refactor route + rename controller |

---

## Next Step

**Execute Phase 1**: Add `BoardRank` and `SortOrder` to entity classes, generate and apply the EF Core migration.

```bash
cd backend/src/HorusVis.Data.Migrations
dotnet ef migrations add AddBoardRankAndSortOrder
dotnet ef database update
```

---

*Confidence: High*
*Full output: [my-tasks-plan.md](my-tasks-plan.md)*
