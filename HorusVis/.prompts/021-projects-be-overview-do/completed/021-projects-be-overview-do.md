<objective>
Implement Projects Backend Phase 2: add two aggregation endpoints to ProjectsService —
GetProjectOverviewAsync (velocity score, next milestone, team workload, task summary) and
GetBoardPreviewAsync (4-column Kanban preview with top-5 tasks per column). Add 7 new response
DTOs and 2 new controller endpoints.

Purpose: Powers the FE Overview tab KPI cards and Board tab preview in Phases 4 and 5.
Output: 7 new DTO files, 2 expanded C# files; `dotnet build HorusVis.sln` passes with 0 errors.
</objective>

<context>
Detailed phase plan (Phase 2):
@.prompts/009-projects-plan/projects-plan.md

Phase 1 service and controller (already implemented — extends these):
@backend/src/HorusVis.Business/Contracts/IProjectsService.cs
@backend/src/HorusVis.Business/Services/ProjectsService.cs
@backend/src/HorusVis.Web/Controllers/ProjectsController.cs

Entity definitions for query writing:
@backend/src/HorusVis.Data/Horusvis/Entities/WorkTask.cs
@backend/src/HorusVis.Data/Horusvis/Entities/TaskAssignee.cs
@backend/src/HorusVis.Data/Horusvis/Entities/ProjectMember.cs
@backend/src/HorusVis.Data/Horusvis/Entities/User.cs
</context>

<requirements>

──────────────────────────────────────────────────────────
PART A — RESPONSE DTOs (add to HorusVis.Business/Models/Projects/)
──────────────────────────────────────────────────────────

1. Create 7 new DTO files under namespace `HorusVis.Business.Models.Projects`:

   **MilestoneDto.cs** (nullable — see note below):
   ```csharp
   public sealed record MilestoneDto(string Title, DateOnly DueDate);
   ```

   **TeamWorkloadItem.cs**:
   ```csharp
   public sealed record TeamWorkloadItem(Guid UserId, string DisplayName, int TaskCount);
   ```

   **TaskSummaryDto.cs**:
   ```csharp
   public sealed record TaskSummaryDto(int Todo, int Working, int Stuck, int Done);
   ```

   **ProjectOverviewDto.cs**:
   ```csharp
   public sealed record ProjectOverviewDto(
       decimal           VelocityScore,
       MilestoneDto?     NextMilestone,
       IReadOnlyList<TeamWorkloadItem> TeamWorkload,
       TaskSummaryDto    TaskSummary
   );
   ```

   **BoardTaskPreviewItem.cs**:
   ```csharp
   public sealed record BoardTaskPreviewItem(
       Guid    Id,
       string  Title,
       string  Priority,
       Guid?   AssigneeUserId
   );
   ```

   **BoardColumnDto.cs**:
   ```csharp
   public sealed record BoardColumnDto(
       string Status,
       int    TaskCount,
       IReadOnlyList<BoardTaskPreviewItem> Tasks
   );
   ```

   **ProjectBoardPreviewDto.cs**:
   ```csharp
   public sealed record ProjectBoardPreviewDto(IReadOnlyList<BoardColumnDto> Columns);
   ```

──────────────────────────────────────────────────────────
PART B — EXPAND IProjectsService
──────────────────────────────────────────────────────────

2. Add two methods to `IProjectsService.cs`:
   ```csharp
   Task<ProjectOverviewDto>      GetProjectOverviewAsync(Guid projectId, CancellationToken ct);
   Task<ProjectBoardPreviewDto>  GetBoardPreviewAsync(Guid projectId, CancellationToken ct);
   ```

──────────────────────────────────────────────────────────
PART C — SERVICE IMPLEMENTATIONS
──────────────────────────────────────────────────────────

3. ADD GetProjectOverviewAsync to `ProjectsService.cs`:

   VelocityScore:
   ```csharp
   var since21 = DateTimeOffset.UtcNow.AddDays(-21);
   var doneLast21 = await dbContext.Set<WorkTask>()
       .CountAsync(t => t.ProjectId == projectId
                     && t.Status == WorkTaskStatus.Done
                     && t.UpdatedAt >= since21, ct);
   var velocityScore = Math.Round(doneLast21 / 3.0m, 1);
   ```

   NextMilestone:
   - **No Milestone entity exists in the schema** — set `MilestoneDto? nextMilestone = null` and
     add a TODO comment: `// TODO: Implement when Milestones table is added in a future migration.`
   - Do NOT query a non-existent table.

   TeamWorkload (active tasks per member):
   ```csharp
   var workload = await dbContext.Set<WorkTask>()
       .Where(t => t.ProjectId == projectId
                && t.Status != WorkTaskStatus.Done)
       .Join(dbContext.Set<TaskAssignee>(),
             t  => t.Id,
             ta => ta.TaskId,
             (t, ta) => new { ta.UserId })
       .Join(dbContext.Set<User>(),
             x => x.UserId,
             u => u.Id,
             (x, u) => new { u.Id, u.FullName })
       .GroupBy(x => new { x.Id, x.FullName })
       .Select(g => new TeamWorkloadItem(g.Key.Id, g.Key.FullName, g.Count()))
       .OrderByDescending(x => x.TaskCount)
       .ToListAsync(ct);
   ```

   TaskSummary:
   ```csharp
   var summary = await dbContext.Set<WorkTask>()
       .Where(t => t.ProjectId == projectId)
       .GroupBy(_ => 1)
       .Select(g => new TaskSummaryDto(
           g.Count(t => t.Status == WorkTaskStatus.ToDo),
           g.Count(t => t.Status == WorkTaskStatus.Working),
           g.Count(t => t.Status == WorkTaskStatus.Stuck),
           g.Count(t => t.Status == WorkTaskStatus.Done)))
       .FirstOrDefaultAsync(ct)
       ?? new TaskSummaryDto(0, 0, 0, 0);
   ```

   Return: `new ProjectOverviewDto(velocityScore, null, workload, summary)`

4. ADD GetBoardPreviewAsync to `ProjectsService.cs`:

   For each WorkTaskStatus (ToDo, Working, Stuck, Done):
   - Count total tasks in that status for the project.
   - Take top 5 ordered by Priority (Critical first) + CreatedAt.
   - Join TaskAssignees to find the primary assignee (take first if multiple).

   Efficient approach — single query per column is acceptable:
   ```csharp
   var statuses = new[] {
       WorkTaskStatus.ToDo, WorkTaskStatus.Working,
       WorkTaskStatus.Stuck, WorkTaskStatus.Done
   };

   var columns = new List<BoardColumnDto>();
   foreach (var status in statuses)
   {
       var totalCount = await dbContext.Set<WorkTask>()
           .CountAsync(t => t.ProjectId == projectId && t.Status == status, ct);

       var topTasks = await dbContext.Set<WorkTask>()
           .Where(t => t.ProjectId == projectId && t.Status == status)
           .OrderBy(t => t.Priority == WorkTaskPriority.Critical ? 0
                       : t.Priority == WorkTaskPriority.High     ? 1
                       : t.Priority == WorkTaskPriority.Medium   ? 2 : 3)
           .ThenBy(t => t.CreatedAt)
           .Take(5)
           .Select(t => new BoardTaskPreviewItem(
               t.Id,
               t.Title,
               t.Priority.ToString(),
               dbContext.Set<TaskAssignee>()
                   .Where(ta => ta.TaskId == t.Id)
                   .Select(ta => (Guid?)ta.UserId)
                   .FirstOrDefault()))
           .ToListAsync(ct);

       columns.Add(new BoardColumnDto(status.ToString(), totalCount, topTasks));
   }
   return new ProjectBoardPreviewDto(columns);
   ```

   NOTE: If EF Core raises a client-eval warning for the nested subquery on AssigneeUserId,
   refactor as a two-step query (load tasks first, then load assignees separately and merge in memory).

──────────────────────────────────────────────────────────
PART D — CONTROLLER ENDPOINTS
──────────────────────────────────────────────────────────

5. ADD to `ProjectsController.cs` (two new action methods):

   ```csharp
   [HttpGet("{projectId}/overview")]
   public async Task<ActionResult<ProjectOverviewDto>> GetProjectOverview(
       Guid projectId, CancellationToken ct)
   // Catch KeyNotFoundException → NotFound

   [HttpGet("{projectId}/board-preview")]
   public async Task<ActionResult<ProjectBoardPreviewDto>> GetBoardPreview(
       Guid projectId, CancellationToken ct)
   // Catch KeyNotFoundException → NotFound
   ```
</requirements>

<output>
Files to create:
- backend/src/HorusVis.Business/Models/Projects/MilestoneDto.cs
- backend/src/HorusVis.Business/Models/Projects/TeamWorkloadItem.cs
- backend/src/HorusVis.Business/Models/Projects/TaskSummaryDto.cs
- backend/src/HorusVis.Business/Models/Projects/ProjectOverviewDto.cs
- backend/src/HorusVis.Business/Models/Projects/BoardTaskPreviewItem.cs
- backend/src/HorusVis.Business/Models/Projects/BoardColumnDto.cs
- backend/src/HorusVis.Business/Models/Projects/ProjectBoardPreviewDto.cs

Files to modify:
- backend/src/HorusVis.Business/Contracts/IProjectsService.cs (2 methods added)
- backend/src/HorusVis.Business/Services/ProjectsService.cs (2 methods added)
- backend/src/HorusVis.Web/Controllers/ProjectsController.cs (2 endpoints added)
</output>

<verification>
Before declaring complete:
1. Run: cd backend && dotnet build HorusVis.sln
   → Must exit 0 with 0 errors
2. Confirm IProjectsService has 7 methods total (5 from Phase 1 + 2 new)
3. Confirm ProjectsController has 15 endpoints total (13 from Phase 1 + 2 new)
4. Confirm NextMilestone is hardcoded null with a TODO comment (no Milestone table query)
5. Confirm VelocityScore = tasks done in last 21 days / 3.0 (rounded to 1 decimal)
6. Confirm TaskSummary uses WorkTaskStatus enum (not string literals)
7. Confirm BoardPreview produces exactly 4 columns (ToDo, Working, Stuck, Done)
</verification>

<summary_requirements>
Create `.prompts/021-projects-be-overview-do/SUMMARY.md`

Template:
# Projects BE Overview — SUMMARY
**{one-liner}**

## Version
v1

## Key Findings
- {overview fields implemented}
- {board preview structure}
- {milestone handling}

## Files Created
- list all created/modified files

## Decisions Needed
- Milestones: hardcoded null until Milestones table added in a future migration.

## Blockers
{build errors if any, or None}

## Next Step
Run Phase 3: `022-projects-fe-api-do.md`
</summary_requirements>

<success_criteria>
- 7 new DTO files created
- IProjectsService: 7 methods total
- ProjectsController: 15 endpoints total
- VelocityScore: doneLast21 / 3.0m rounded to 1 decimal
- NextMilestone: null with TODO comment
- TeamWorkload: join Tasks → TaskAssignees → Users, grouped and sorted
- TaskSummary: GroupBy with conditional counts per status
- BoardPreview: 4 columns, top-5 tasks each, priority-ordered
- `dotnet build HorusVis.sln` passes with 0 errors
- SUMMARY.md created at .prompts/021-projects-be-overview-do/SUMMARY.md
</success_criteria>
