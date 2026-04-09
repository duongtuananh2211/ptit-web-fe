<plan>
  <summary>
    Two-phase backend plan for the Sprint feature. Phase 1 creates all DTOs, ISprintsService
    (6 read-only methods), SprintsService implementation, and SprintsController read-only
    endpoints. Phase 2 adds 4 sprint-item assignment methods (assign/unassign task + issue)
    with project-membership auth checks. Both phases must produce `dotnet build` with 0 errors.
    Entity + migration are already in place; no schema changes are needed.
  </summary>

  <phases>
    <phase number="1" name="sprint-query-service">
      ## Phase 1 — Sprint Query Service + Controller base

      ### Goal
      Expose all sprint read queries through a typed service and HTTP API.
      No mutation of sprint metadata itself (sprints are seeded, not user-created).

      ### Files to CREATE

      #### 1. `HorusVis.Business/Models/Sprints/SprintDto.cs`
      ```csharp
      namespace HorusVis.Business.Models.Sprints;

      public sealed record SprintDto(
          Guid     Id,
          string   SprintCode,
          DateOnly StartDate,
          DateOnly EndDate,
          string?  Goal,
          bool     IsCurrent
      );
      ```
      `IsCurrent` computed by:
      ```csharp
      var today = DateOnly.FromDateTime(DateTime.UtcNow);
      bool isCurrent = today >= sprint.StartDate && today <= sprint.EndDate;
      ```

      #### 2. `HorusVis.Business/Models/Sprints/SprintBoardTaskItem.cs`
      ```csharp
      namespace HorusVis.Business.Models.Sprints;

      public sealed record SprintBoardTaskItem(
          Guid    Id,
          string  Title,
          string  Status,    // WorkTaskStatus.ToString()
          string  Priority,  // WorkTaskPriority.ToString()
          Guid?   AssigneeUserId,
          string? AssigneeName
      );
      ```
      `AssigneeUserId` / `AssigneeName` come from the first `TaskAssignee` row where
      `AssignmentType == AssignmentType.Primary`, falling back to the first row if none is Primary;
      null if no assignees exist.

      #### 3. `HorusVis.Business/Models/Sprints/SprintBoardIssueItem.cs`
      ```csharp
      namespace HorusVis.Business.Models.Sprints;

      public sealed record SprintBoardIssueItem(
          Guid    Id,
          string  IssueCode,
          string  Title,
          string  Severity,  // IssueSeverity.ToString()
          string  Status,    // IssueStatus.ToString()
          Guid?   AssigneeUserId,
          string? AssigneeName
      );
      ```
      `AssigneeUserId` / `AssigneeName` from `Issue.CurrentAssigneeUserId` /
      `Issue.CurrentAssigneeUser.FullName`.

      #### 4. `HorusVis.Business/Models/Sprints/SprintBoardColumn.cs`
      ```csharp
      namespace HorusVis.Business.Models.Sprints;

      public sealed record SprintBoardColumn(
          string                            Status,
          int                               TaskCount,
          IReadOnlyList<SprintBoardTaskItem> Tasks
      );
      ```
      Columns are grouped by `WorkTaskStatus`; order follows enum declaration order.

      #### 5. `HorusVis.Business/Models/Sprints/SprintBoardDto.cs`
      ```csharp
      namespace HorusVis.Business.Models.Sprints;

      public sealed record SprintBoardDto(
          SprintDto                          Sprint,
          IReadOnlyList<SprintBoardColumn>   TaskColumns,
          IReadOnlyList<SprintBoardIssueItem> Issues
      );
      ```

      #### 6. `HorusVis.Business/Models/Sprints/BacklogTaskItem.cs`
      ```csharp
      namespace HorusVis.Business.Models.Sprints;

      public sealed record BacklogTaskItem(
          Guid    Id,
          string  Title,
          string  Status,
          string  Priority,
          Guid    ProjectId,
          string  ProjectName,
          Guid?   FeatureAreaId,
          string? FeatureAreaName
      );
      ```

      #### 7. `HorusVis.Business/Models/Sprints/BacklogIssueItem.cs`
      ```csharp
      namespace HorusVis.Business.Models.Sprints;

      public sealed record BacklogIssueItem(
          Guid   Id,
          string IssueCode,
          string Title,
          string Severity,
          string Status,
          Guid   ProjectId,
          string ProjectName
      );
      ```

      #### 8. `HorusVis.Business/Contracts/ISprintsService.cs`
      (Full interface — see `&lt;interface_signatures&gt;` section.)

      #### 9. `HorusVis.Business/Services/SprintsService.cs`
      Injects only `HorusVisDbContext dbContext`.

      Key implementation notes:
      - `GetAllSprintsAsync`: `SELECT * FROM Sprints ORDER BY StartDate`; map each to `SprintDto`
        with computed `IsCurrent`.
      - `GetCurrentSprintAsync`: filter `StartDate <= today AND EndDate >= today`; return null
        if none found.
      - `GetSprintByIdAsync`: find by `Id`; throw `KeyNotFoundException` if missing.
      - `GetSprintByCodeAsync`: find by `SprintCode` (case-insensitive); throw
        `KeyNotFoundException` if missing.
      - `GetSprintBoardAsync`: load sprint by id (throw 404-mapped exception if missing);
        then load tasks with their assignees:
        ```csharp
        var tasks = await dbContext.Set&lt;WorkTask&gt;()
            .Where(t => t.SprintId == sprintId)
            .Select(t => new {
                t.Id, t.Title, t.Status, t.Priority,
                PrimaryAssignee = t... // join TaskAssignee
            })
            .ToListAsync(ct);
        ```
        Use a join with `TaskAssignees` table to get the `Primary` assignee (or first available).
        Group tasks by `Status.ToString()` to produce `SprintBoardColumn` list.
        Load issues similarly, using `Issue.CurrentAssigneeUserId` / `CurrentAssigneeUser.FullName`.
      - `GetProjectBacklogAsync`: verify caller is active `ProjectMember` of `projectId`;
        throw `UnauthorizedAccessException` if not. Return tasks where
        `ProjectId == projectId AND SprintId == null`, and issues where
        `ProjectId == projectId AND SprintId == null`.

      #### 10. `HorusVis.Web/Controllers/SprintsController.cs`
      ```csharp
      [ApiController]
      [Authorize]
      [Route("api/sprints")]
      public sealed class SprintsController(ISprintsService sprints) : ControllerBase
      ```
      Endpoints (Phase 1 only):
      - `GET /api/sprints` → `GetAllSprints()`
      - `GET /api/sprints/current` → `GetCurrentSprint()` — returns 204 if null
      - `GET /api/sprints/{id:guid}` → `GetSprintById(Guid id)` — try/catch KeyNotFoundException → 404
      - `GET /api/sprints/by-code/{code}` → `GetSprintByCode(string code)` — try/catch → 404
      - `GET /api/sprints/{id:guid}/board` → `GetSprintBoard(Guid id)` — try/catch → 404

      **Backlog endpoint** goes on `ProjectsController` (NOT SprintsController):
      - Add `ISprintsService sprints` to `ProjectsController` primary constructor
      - Add: `GET /api/projects/{projectId:guid}/backlog`

      ### Files to MODIFY

      #### `HorusVis.Business/ServiceCollectionExtensions.cs`
      Add one line inside `AddHorusVisBusiness()`:
      ```csharp
      services.AddScoped&lt;ISprintsService, SprintsService&gt;();
      ```

      ### Acceptance Criteria
      - `dotnet build` passes with 0 errors
      - `GET /api/sprints/current` returns 204 when no active sprint exists today
      - All read endpoints return correct HTTP verbs and status codes
      - Board groups tasks by `WorkTaskStatus` value
      - Backlog excludes tasks/issues already assigned to a sprint
    </phase>

    <phase number="2" name="sprint-item-assignment">
      ## Phase 2 — Sprint Item Assignment

      ### Goal
      Allow authorised project members to assign/unassign tasks and issues to/from a sprint.

      ### Files to MODIFY

      #### `HorusVis.Business/Contracts/ISprintsService.cs`
      Add 4 methods (see full interface in `&lt;interface_signatures&gt;`).

      #### `HorusVis.Business/Services/SprintsService.cs`
      Implement 4 assignment methods.

      Auth check pattern (same for all 4 methods):
      ```csharp
      var isMember = await dbContext.Set&lt;ProjectMember&gt;()
          .AnyAsync(m =>
              m.ProjectId == entity.ProjectId &&
              m.UserId    == callerId &&
              m.MemberStatus == MemberStatus.Active, ct);
      if (!isMember)
          throw new UnauthorizedAccessException("Caller is not an active project member.");
      ```

      `AssignTaskToSprintAsync(sprintId, taskId, callerId)`:
      1. Load sprint by `sprintId` → throw `KeyNotFoundException` if missing.
      2. Load task by `taskId` → throw `KeyNotFoundException` if missing.
      3. Auth check using `task.ProjectId`.
      4. Set `task.SprintId = sprintId`.
      5. `await dbContext.SaveChangesAsync(ct)`.

      `UnassignTaskFromSprintAsync(taskId, callerId)`:
      1. Load task by `taskId` → throw `KeyNotFoundException` if missing.
      2. Auth check using `task.ProjectId`.
      3. Set `task.SprintId = null`.
      4. `await dbContext.SaveChangesAsync(ct)`.

      `AssignIssueToSprintAsync(sprintId, issueId, callerId)`:
      1. Load sprint by `sprintId` → throw `KeyNotFoundException` if missing.
      2. Load issue by `issueId` → throw `KeyNotFoundException` if missing.
      3. Auth check using `issue.ProjectId`.
      4. Set `issue.SprintId = sprintId`.
      5. `await dbContext.SaveChangesAsync(ct)`.

      `UnassignIssueFromSprintAsync(issueId, callerId)`:
      1. Load issue by `issueId` → throw `KeyNotFoundException` if missing.
      2. Auth check using `issue.ProjectId`.
      3. Set `issue.SprintId = null`.
      4. `await dbContext.SaveChangesAsync(ct)`.

      #### `HorusVis.Web/Controllers/SprintsController.cs`
      Add 4 endpoints:
      ```
      POST   /api/sprints/{id:guid}/tasks/{taskId:guid}   → AssignTask    → 204 / 404 / 403
      DELETE /api/sprints/tasks/{taskId:guid}             → UnassignTask  → 204 / 404 / 403
      POST   /api/sprints/{id:guid}/issues/{issueId:guid} → AssignIssue   → 204 / 404 / 403
      DELETE /api/sprints/issues/{issueId:guid}           → UnassignIssue → 204 / 404 / 403
      ```
      All return `NoContent()` (204) on success.
      Catch `KeyNotFoundException` → 404.
      Catch `UnauthorizedAccessException` → 403 Forbid().

      `GetCallerId()` helper from `User.FindFirstValue(ClaimTypes.NameIdentifier)` — same
      pattern as `ProjectsController`.

      ### Acceptance Criteria
      - `dotnet build` passes with 0 errors
      - POST assigns and persists `SprintId` on the entity
      - DELETE sets `SprintId = null`
      - Non-member caller receives 403
      - Unknown sprint/task/issue IDs receive 404
    </phase>
  </phases>

  <dto_inventory>
## DTO Inventory — all fields match entity property names

### SprintDto
| Field        | Type     | Source                          |
|--------------|----------|---------------------------------|
| Id           | Guid     | Sprint.Id                       |
| SprintCode   | string   | Sprint.SprintCode               |
| StartDate    | DateOnly | Sprint.StartDate                |
| EndDate      | DateOnly | Sprint.EndDate                  |
| Goal         | string?  | Sprint.Goal                     |
| IsCurrent    | bool     | computed: today in [Start, End] |

### SprintBoardTaskItem
| Field           | Type    | Source                                                       |
|-----------------|---------|--------------------------------------------------------------|
| Id              | Guid    | WorkTask.Id                                                  |
| Title           | string  | WorkTask.Title                                               |
| Status          | string  | WorkTask.Status.ToString() (WorkTaskStatus enum)             |
| Priority        | string  | WorkTask.Priority.ToString() (WorkTaskPriority enum)         |
| AssigneeUserId  | Guid?   | TaskAssignee[Primary].UserId (first Primary; else first row) |
| AssigneeName    | string? | TaskAssignee[Primary].User.FullName                          |

### SprintBoardIssueItem
| Field           | Type    | Source                                    |
|-----------------|---------|-------------------------------------------|
| Id              | Guid    | Issue.Id                                  |
| IssueCode       | string  | Issue.IssueCode                           |
| Title           | string  | Issue.Title                               |
| Severity        | string  | Issue.Severity.ToString() (IssueSeverity) |
| Status          | string  | Issue.Status.ToString() (IssueStatus)     |
| AssigneeUserId  | Guid?   | Issue.CurrentAssigneeUserId               |
| AssigneeName    | string? | Issue.CurrentAssigneeUser?.FullName       |

### SprintBoardColumn
| Field      | Type                              | Source                              |
|------------|-----------------------------------|-------------------------------------|
| Status     | string                            | WorkTaskStatus value (group key)    |
| TaskCount  | int                               | Tasks.Count                         |
| Tasks      | IReadOnlyList&lt;SprintBoardTaskItem&gt; | tasks for this Status group         |

### SprintBoardDto
| Field       | Type                                   | Source                |
|-------------|----------------------------------------|-----------------------|
| Sprint      | SprintDto                              | mapped Sprint         |
| TaskColumns | IReadOnlyList&lt;SprintBoardColumn&gt;      | grouped task data     |
| Issues      | IReadOnlyList&lt;SprintBoardIssueItem&gt;   | issue data for sprint |

### BacklogTaskItem
| Field           | Type    | Source                                            |
|-----------------|---------|---------------------------------------------------|
| Id              | Guid    | WorkTask.Id                                       |
| Title           | string  | WorkTask.Title                                    |
| Status          | string  | WorkTask.Status.ToString()                        |
| Priority        | string  | WorkTask.Priority.ToString()                      |
| ProjectId       | Guid    | WorkTask.ProjectId                                |
| ProjectName     | string  | WorkTask.Project.ProjectName                      |
| FeatureAreaId   | Guid?   | WorkTask.FeatureAreaId                            |
| FeatureAreaName | string? | WorkTask.FeatureArea?.Name (check exact property) |

### BacklogIssueItem
| Field       | Type   | Source                              |
|-------------|--------|-------------------------------------|
| Id          | Guid   | Issue.Id                            |
| IssueCode   | string | Issue.IssueCode                     |
| Title       | string | Issue.Title                         |
| Severity    | string | Issue.Severity.ToString()           |
| Status      | string | Issue.Status.ToString()             |
| ProjectId   | Guid   | Issue.ProjectId                     |
| ProjectName | string | Issue.Project.ProjectName           |
  </dto_inventory>

  <interface_signatures>
```csharp
using HorusVis.Business.Models.Sprints;

namespace HorusVis.Business.Contracts;

public interface ISprintsService
{
    // ─── Phase 1: Read queries ─────────────────────────────────────────────

    /// <summary>Returns all sprints ordered by StartDate ascending.</summary>
    Task&lt;IReadOnlyList&lt;SprintDto&gt;&gt; GetAllSprintsAsync(CancellationToken ct = default);

    /// <summary>
    /// Returns the sprint whose StartDate &lt;= today &lt;= EndDate, or null if none.
    /// </summary>
    Task&lt;SprintDto?&gt; GetCurrentSprintAsync(CancellationToken ct = default);

    /// <summary>Throws KeyNotFoundException if sprint not found.</summary>
    Task&lt;SprintDto&gt; GetSprintByIdAsync(Guid sprintId, CancellationToken ct = default);

    /// <summary>Throws KeyNotFoundException if sprint not found.</summary>
    Task&lt;SprintDto&gt; GetSprintByCodeAsync(string sprintCode, CancellationToken ct = default);

    /// <summary>
    /// Returns sprint board with tasks grouped by status and all sprint issues.
    /// Throws KeyNotFoundException if sprint not found.
    /// </summary>
    Task&lt;SprintBoardDto&gt; GetSprintBoardAsync(Guid sprintId, CancellationToken ct = default);

    /// <summary>
    /// Returns tasks and issues with SprintId == null for the given project.
    /// Throws UnauthorizedAccessException if callerId is not an active ProjectMember.
    /// Throws KeyNotFoundException if projectId does not exist.
    /// </summary>
    Task&lt;BacklogDto&gt; GetProjectBacklogAsync(Guid projectId, Guid callerId, CancellationToken ct = default);

    // ─── Phase 2: Sprint item assignment ──────────────────────────────────

    /// <summary>
    /// Assigns a WorkTask to the specified sprint.
    /// Throws KeyNotFoundException if sprint or task not found.
    /// Throws UnauthorizedAccessException if caller is not an active member of the task's project.
    /// </summary>
    Task AssignTaskToSprintAsync(Guid sprintId, Guid taskId, Guid callerId, CancellationToken ct = default);

    /// <summary>
    /// Removes a WorkTask from its sprint (sets SprintId = null).
    /// Throws KeyNotFoundException if task not found.
    /// Throws UnauthorizedAccessException if caller is not an active member of the task's project.
    /// </summary>
    Task UnassignTaskFromSprintAsync(Guid taskId, Guid callerId, CancellationToken ct = default);

    /// <summary>
    /// Assigns an Issue to the specified sprint.
    /// Throws KeyNotFoundException if sprint or issue not found.
    /// Throws UnauthorizedAccessException if caller is not an active member of the issue's project.
    /// </summary>
    Task AssignIssueToSprintAsync(Guid sprintId, Guid issueId, Guid callerId, CancellationToken ct = default);

    /// <summary>
    /// Removes an Issue from its sprint (sets SprintId = null).
    /// Throws KeyNotFoundException if issue not found.
    /// Throws UnauthorizedAccessException if caller is not an active member of the issue's project.
    /// </summary>
    Task UnassignIssueFromSprintAsync(Guid issueId, Guid callerId, CancellationToken ct = default);
}
```
  </interface_signatures>

  <controller_routes>
## SprintsController routes

| Verb   | Route                                  | Action          | Auth      | Returns              |
|--------|----------------------------------------|-----------------|-----------|----------------------|
| GET    | /api/sprints                           | GetAllSprints   | [Authorize] | 200 `IReadOnlyList<SprintDto>` |
| GET    | /api/sprints/current                   | GetCurrentSprint | [Authorize] | 200 `SprintDto` or 204 No Content |
| GET    | /api/sprints/{id:guid}                 | GetSprintById   | [Authorize] | 200 `SprintDto` or 404 |
| GET    | /api/sprints/by-code/{code}            | GetSprintByCode | [Authorize] | 200 `SprintDto` or 404 |
| GET    | /api/sprints/{id:guid}/board           | GetSprintBoard  | [Authorize] | 200 `SprintBoardDto` or 404 |
| POST   | /api/sprints/{id:guid}/tasks/{taskId:guid}   | AssignTask     | [Authorize] | 204 or 404 or 403 |
| DELETE | /api/sprints/tasks/{taskId:guid}             | UnassignTask   | [Authorize] | 204 or 404 or 403 |
| POST   | /api/sprints/{id:guid}/issues/{issueId:guid} | AssignIssue    | [Authorize] | 204 or 404 or 403 |
| DELETE | /api/sprints/issues/{issueId:guid}           | UnassignIssue  | [Authorize] | 204 or 404 or 403 |

## ProjectsController routes added in Phase 1

| Verb | Route                                | Action            | Auth      | Returns              |
|------|--------------------------------------|-------------------|-----------|----------------------|
| GET  | /api/projects/{projectId:guid}/backlog | GetProjectBacklog | [Authorize] | 200 `BacklogDto` or 404 or 403 |

**Note:** `ProjectsController` already has `[Authorize]` at class level. Add `ISprintsService sprints`
as the last parameter of the primary constructor to preserve existing constructor parameter order.
  </controller_routes>

  <metadata>
    <confidence level="high">
      All entity field names verified by reading source files directly.
      Pattern for service/controller structure confirmed from ProjectsService + ProjectsController.
      GetCallerId() pattern confirmed (ClaimTypes.NameIdentifier).
      ServiceCollectionExtensions.cs structure confirmed — single `AddScoped` line required.
      Issue.CurrentAssigneeUserId + CurrentAssigneeUser confirmed as direct FK on Issue entity.
      TaskAssignee.AssignmentType == Primary confirmed from enum file.
      ProjectMember.MemberStatus field name confirmed.
    </confidence>

    <dependencies>
      - Phase 2 depends on Phase 1 (ISprintsService and SprintsService must exist first)
      - BacklogDto and BacklogTaskItem/BacklogIssueItem created in Phase 1
      - FeatureArea entity: `FeatureAreaName` mapped from `FeatureArea?.Name` — verify exact
        property name on FeatureArea entity before executing Do prompt
      - Project entity: `ProjectName` confirmed used in ProjectsService queries
      - User entity: `FullName` used for assignee name — verify this exists on User
      - MemberStatus enum value: `MemberStatus.Active` — verify exact enum value name
    </dependencies>

    <open_questions>
      1. FeatureArea entity: is the text property `Name` or `AreaName`? — check
         `HorusVis.Data/Horusvis/Entities/FeatureArea.cs` before writing BacklogTaskItem query.
      2. User entity: is the display name field `FullName`? — check
         `HorusVis.Data/Horusvis/Entities/User.cs`.
      3. MemberStatus enum: confirm `Active` is the correct value name (vs `Activated`).
      4. Should `GetSprintBoardAsync` include tasks from ALL projects in the sprint, or only
         tasks the caller can see? (Current plan: all tasks — sprint is global.)
      5. Should `GetProjectBacklogAsync` require the caller to be a project member, or can any
         authenticated user see the backlog? (Current plan: must be active member.)
    </open_questions>

    <assumptions>
      - Sprint is global (no ProjectId) — confirmed. Board shows ALL tasks/issues for that sprint
        across all projects.
      - Backlog is per-project scope: `WHERE ProjectId = @projectId AND SprintId IS NULL`.
      - `IsCurrent` is computed every time from `DateTime.UtcNow`; no caching needed.
      - `SprintBoardColumn` status strings match `WorkTaskStatus.ToString()` values (backend
        controls the canonical status string).
      - No CRUD endpoints for Sprint records themselves (sprints are seeded, not user-managed).
      - `dotnet build` includes HorusVis.Web, HorusVis.Business, HorusVis.Core, HorusVis.Data.
      - Primary constructor injection pattern (C# 12) used throughout — no field declarations needed.
      - All HTTP error responses follow existing pattern: `return NotFound(new { e.Message })`.
    </assumptions>
  </metadata>
</plan>
