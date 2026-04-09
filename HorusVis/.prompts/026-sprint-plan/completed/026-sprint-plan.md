<objective>
Create a backend implementation plan for the Sprint feature in HorusVis.

Purpose: Produce a phased, actionable plan for implementing Sprint CRUD, sprint-item assignment,
and the "current sprint" query — ready to be executed as one or more Do prompts.
Input: Sprint research findings + current codebase state (entity + migration already done).
Output: .prompts/026-sprint-plan/sprint-plan.md with phases + SUMMARY.md
</objective>

<context>
Research findings (read fully before planning):
@.prompts/025-sprint-research/sprint-research.md

Current Sprint entity (ALREADY IMPLEMENTED — global, no ProjectId, no status):
@backend/src/HorusVis.Data/Horusvis/Entities/Sprint.cs

WorkTask entity (SprintId? already added):
@backend/src/HorusVis.Data/Horusvis/Entities/WorkTask.cs

Issue entity (SprintId? already added):
@backend/src/HorusVis.Data/Horusvis/Entities/Issue.cs

Existing service pattern to follow (primary constructor injection, dbContext.Set<T>()):
@backend/src/HorusVis.Business/Services/ProjectsService.cs

Existing controller pattern (primary constructor, catch KeyNotFoundException/UnauthorizedAccessException/InvalidOperationException):
@backend/src/HorusVis.Web/Controllers/ProjectsController.cs

ServiceCollectionExtensions (where new services must be registered):
@backend/src/HorusVis.Business/ServiceCollectionExtensions.cs

IProjectsService (interface pattern to follow):
@backend/src/HorusVis.Business/Contracts/IProjectsService.cs
</context>

<current_state>
The following are ALREADY DONE — do not re-plan them, only reference them:
- Sprint entity: `HorusVis.Data/Horusvis/Entities/Sprint.cs` (Id, SprintCode, StartDate, EndDate, Goal?)
- WorkTask.SprintId? and Issue.SprintId? FK columns added
- EF Core migration `AddSprint` created and seeded 21 sprints (2026Q1–2026Q3)
- Sprint is GLOBAL (no ProjectId) — shared calendar across all projects

Key decisions already confirmed by user:
- No SprintStatus enum — current sprint = TODAY BETWEEN StartDate AND EndDate
- IP sprint always 14 days (may overflow quarter boundary)
- One Active sprint per project enforced (a task can only be in one sprint at a time)
- Tasks without PlanEstimate are excluded from velocity calculation
- Q4 uses calendar year of the month (Jan 2027 = 2027Q4)
</current_state>

<planning_requirements>
Plan the BACKEND implementation in logical phases. Each phase should be independently executable as a Do prompt.

The plan must cover:

1. **Sprint Query Service** (`ISprintsService` + `SprintsService`)
   - `GetAllSprintsAsync()` — return all sprints ordered by StartDate
   - `GetCurrentSprintAsync()` — sprint where TODAY is between StartDate and EndDate (returns null if between sprints)
   - `GetSprintByIdAsync(Guid sprintId)` — single sprint by ID
   - `GetSprintByCodeAsync(string sprintCode)` — single sprint by code

2. **Sprint Item Assignment** (assign/unassign tasks and issues to/from sprints)
   - `AssignTaskToSprintAsync(Guid sprintId, Guid taskId, Guid callerId)` — set WorkTask.SprintId
   - `UnassignTaskFromSprintAsync(Guid taskId, Guid callerId)` — set WorkTask.SprintId = null (back to backlog)
   - `AssignIssueToSprintAsync(Guid sprintId, Guid issueId, Guid callerId)` — set Issue.SprintId
   - `UnassignIssueFromSprintAsync(Guid issueId, Guid callerId)` — set Issue.SprintId = null
   - Auth rule: caller must be a ProjectMember of the task's/issue's project

3. **Sprint Board** (`GetSprintBoardAsync(Guid sprintId)`)
   - Return all WorkTasks assigned to this sprint, grouped by WorkTaskStatus (4 columns)
   - Return all Issues assigned to this sprint, grouped by IssueStatus
   - Include assignee info for tasks and issues

4. **Backlog Query** (`GetProjectBacklogAsync(Guid projectId, Guid callerId)`)
   - WorkTasks where SprintId IS NULL and ProjectId = projectId
   - Issues where SprintId IS NULL and ProjectId = projectId

5. **Controller endpoints** (`SprintsController`)
   - `GET  /api/sprints` — all sprints
   - `GET  /api/sprints/current` — current sprint (today's date)
   - `GET  /api/sprints/{id}` — sprint by ID
   - `GET  /api/sprints/by-code/{code}` — sprint by SprintCode
   - `POST /api/sprints/{id}/tasks/{taskId}` — assign task to sprint
   - `DELETE /api/sprints/tasks/{taskId}` — unassign task (→ backlog)
   - `POST /api/sprints/{id}/issues/{issueId}` — assign issue to sprint
   - `DELETE /api/sprints/issues/{issueId}` — unassign issue (→ backlog)
   - `GET  /api/sprints/{id}/board` — sprint board
   - `GET  /api/projects/{projectId}/backlog` — project backlog (tasks + issues with SprintId=null)
     NOTE: The backlog endpoint belongs on ProjectsController or a dedicated BacklogController — plan should decide.

Constraints:
- SprintsService injects only HorusVisDbContext (no ProjectsService dependency)
- All DTOs go under `HorusVis.Business/Models/Sprints/`
- ISprintsService registered as Scoped in ServiceCollectionExtensions
- Build must pass with 0 errors after each phase

Out of scope for this plan:
- Sprint creation/editing/deletion (sprints are calendar-defined; seeded via migration)
- Frontend implementation
- Sprint velocity updates to GetProjectOverviewAsync (defer to a separate prompt)
</planning_requirements>

<output_structure>
Save to: `d:\VuND\ptit-web-fe\HorusVis\.prompts\026-sprint-plan\sprint-plan.md`

Structure using this XML format:

```xml
<plan>
  <summary>
    One paragraph overview of the phased approach.
  </summary>

  <phases>
    <phase number="1" name="sprint-query-service">
      <objective>What this phase produces</objective>
      <tasks>
        <task priority="high">Specific file to create/edit</task>
      </tasks>
      <deliverables>
        <deliverable>Exact files created or modified</deliverable>
      </deliverables>
      <dependencies>What must already exist</dependencies>
    </phase>
    <!-- phases 2, 3 -->
  </phases>

  <dto_inventory>
    List every DTO record needed, with fields. Group by phase.
  </dto_inventory>

  <interface_signatures>
    Full C# interface method signatures for ISprintsService.
  </interface_signatures>

  <controller_routes>
    Table: HTTP verb | Route | Action | Auth | Returns
  </controller_routes>

  <metadata>
    <confidence level="high|medium|low">Rationale</confidence>
    <dependencies>External requirements</dependencies>
    <open_questions>Unresolved technical questions</open_questions>
    <assumptions>What was assumed</assumptions>
  </metadata>
</plan>
```
</output_structure>

<summary_requirements>
Create `d:\VuND\ptit-web-fe\HorusVis\.prompts\026-sprint-plan\SUMMARY.md`

Include:
- One-liner: Substantive description of the phased approach
- Version: v1
- Key Findings: Phase breakdown with file counts
- Decisions Needed: Any unresolved choices before Do prompts can run
- Blockers: External impediments
- Next Step: Concrete — "Create Do prompt 027-sprint-be-do"
</summary_requirements>

<success_criteria>
1. sprint-plan.md created with all phases fully specified
2. Every DTO is named and its fields listed
3. ISprintsService interface is complete (all method signatures written out)
4. Controller route table is complete (all 10 endpoints)
5. Backlog endpoint placement decided (SprintsController vs ProjectsController vs BacklogController)
6. Phase breakdown is executable as sequential Do prompts
7. SUMMARY.md created with substantive one-liner
</success_criteria>
