<?xml version="1.0" encoding="UTF-8"?>
<plan>
  <summary>
    Implement the My Tasks workstream (Task 03) for HorusVis: a user-scoped Kanban board with drag-and-drop task management, inline subtask effort editing, issue tracking with a 4-stage workflow stepper, and server-computed task progress.
  </summary>

  <phases>

    <!-- ═══════════════════════════════════════════════════════════════════
         PHASE 1 — DB Migration: Add BoardRank + SortOrder
         ═══════════════════════════════════════════════════════════════== -->
    <phase number="1" name="DB Migration — BoardRank and SortOrder">
      <objective>
        Add the two columns missing from the initial schema that are required for
        drag-and-drop persistence and subtask table ordering.  Run the migration
        against the local PostgreSQL database.
      </objective>

      <context>
        The InitialCreate migration (20260407174335) already contains Tasks,
        Issues, and Subtasks tables.  Two columns are absent:
        - Tasks.BoardRank  — persists card position within a Kanban column
        - Subtasks.SortOrder — persists row order in the SubtaskTable

        Once added, TasksService can ORDER BY BoardRank per Status column and
        SubtasksService can ORDER BY SortOrder.
      </context>

      <tasks>
        <task priority="high">
          Add EF Core entity property `decimal BoardRank` to the Task entity class
          (wherever the entity is defined — follow the existing entity convention).
          Configure as `numeric(10,4) NOT NULL DEFAULT 0` in OnModelCreating
          or via a Fluent API call.
        </task>
        <task priority="high">
          Add EF Core entity property `int SortOrder` to the Subtask entity class.
          Configure as `integer NOT NULL DEFAULT 0`.
        </task>
        <task priority="high">
          Run `dotnet ef migrations add AddBoardRankAndSortOrder` from
          `backend/src/HorusVis.Data.Migrations/`.
          Resulting file: `Migrations/YYYYMMDDHHMMSS_AddBoardRankAndSortOrder.cs`
        </task>
        <task priority="high">
          Run `dotnet ef database update` to apply migration.
        </task>
        <task priority="medium">
          Verify Tasks.Status string enum values match Kanban column names.
          Expected domain values: "ToDo" | "Working" | "Stuck" | "Done".
          If the initial seeding uses different casing, document the canonical
          string values here so all layers are consistent.
        </task>
      </tasks>

      <deliverables>
        <deliverable>Migration file: `backend/src/HorusVis.Data.Migrations/Migrations/YYYYMMDDHHMMSS_AddBoardRankAndSortOrder.cs`</deliverable>
        <deliverable>Tasks entity updated with `BoardRank` property</deliverable>
        <deliverable>Subtasks entity updated with `SortOrder` property</deliverable>
        <deliverable>Database schema applied locally</deliverable>
      </deliverables>

      <dependencies>None — all prerequisite tables exist from InitialCreate.</dependencies>
    </phase>


    <!-- ═══════════════════════════════════════════════════════════════════
         PHASE 2 — BE Service Layer
         ═══════════════════════════════════════════════════════════════== -->
    <phase number="2" name="BE Service Layer — Tasks, Issues, Subtasks">
      <objective>
        Implement all business logic in the Business project.  Controllers in
        Phase 3 will call only these services.  No business rules in controllers.
      </objective>

      <context>
        Existing scaffolds (all empty):
          backend/src/HorusVis.Business/Contracts/IMyTasksService.cs
          backend/src/HorusVis.Business/Services/MyTasksService.cs

        New interfaces + implementations to create:
          ITasksService / TasksService
          IIssuesService / IssuesService
          ISubtasksService / SubtasksService
          TaskProgressCalculator (static helper or scoped service)

        IMyTasksService / MyTasksService will be repurposed for the board query only.
        Register all new services in
          backend/src/HorusVis.Business/ServiceCollectionExtensions.cs
      </context>

      <tasks>
        <!-- ── IMyTasksService ── -->
        <task priority="high">
          Expand `IMyTasksService` to declare:
            `Task&lt;MyBoardDto&gt; GetMyBoardAsync(Guid userId, CancellationToken ct)`
          Implement in `MyTasksService` using a single EF Core projection that:
          - Filters Tasks WHERE current user is in TaskAssignees (any AssignmentType)
          - Groups by Status into 4 buckets: ToDo / Working / Stuck / Done
          - Orders each bucket BY BoardRank ASC
          - Projects to `MyBoardDto` with 4 lists of `TaskCardDto`
          - `TaskCardDto` fields: Id, Title, Priority, Status, BoardRank,
            ProgressPercent, IssueCount (open only), PrimaryAssignee (first
            TaskAssignee), FeatureAreaName, DueDate
        </task>

        <!-- ── ITasksService ── -->
        <task priority="high">
          Create `backend/src/HorusVis.Business/Contracts/ITasksService.cs`:
          ```csharp
          Task&lt;TaskDetailDto&gt; GetTaskDetailAsync(Guid taskId, CancellationToken ct);
          Task&lt;TaskCardDto&gt;   CreateTaskAsync(CreateTaskRequest req, Guid createdByUserId, CancellationToken ct);
          Task&lt;TaskCardDto&gt;   UpdateTaskAsync(Guid taskId, UpdateTaskRequest req, CancellationToken ct);
          Task               DeleteTaskAsync(Guid taskId, CancellationToken ct);
          Task&lt;TaskCardDto&gt;   MoveTaskAsync(Guid taskId, MoveTaskRequest req, CancellationToken ct);
          ```
        </task>
        <task priority="high">
          Create `backend/src/HorusVis.Business/Services/TasksService.cs`.

          Business rules enforced here (NOT in controller):
          - `UpdateTaskAsync`: if request sets Status = "Done", call
            `TaskProgressCalculator` to validate: throw `BusinessRuleException`
            with HTTP 400 payload if any Issue with Status != "Closed" is linked,
            OR any Subtask with State != "Completed" is linked.
          - `UpdateTaskAsync`: if request sets Status = "Stuck", record BlockedNote.
          - `MoveTaskAsync`: updates Status and BoardRank; if moving to "Done"
            runs the same blocking check above.
          - After any subtask mutation, recalculate ProgressPercent and persist.

          `TaskDetailDto` fields: all TaskCardDto fields + Description,
          StartDate, PlanEstimate, AssigneeList, FeatureAreaId,
          Subtasks (list of SubtaskDto), Issues (list of IssueSummaryDto).
        </task>

        <!-- ── IIssuesService ── -->
        <task priority="high">
          Create `backend/src/HorusVis.Business/Contracts/IIssuesService.cs`:
          ```csharp
          Task&lt;IssueDetailDto&gt;  GetIssueDetailAsync(Guid issueId, CancellationToken ct);
          Task&lt;IssueSummaryDto&gt; CreateIssueAsync(CreateIssueRequest req, Guid reporterUserId, CancellationToken ct);
          Task&lt;IssueSummaryDto&gt; UpdateIssueAsync(Guid issueId, UpdateIssueRequest req, CancellationToken ct);
          Task                 AdvanceWorkflowAsync(Guid issueId, AdvanceWorkflowRequest req, Guid changedByUserId, CancellationToken ct);
          Task                 DeleteIssueAsync(Guid issueId, CancellationToken ct);
          ```
        </task>
        <task priority="high">
          Create `backend/src/HorusVis.Business/Services/IssuesService.cs`.

          Business rules:
          - `AdvanceWorkflowAsync`: WorkflowStage transitions are forward-only:
            Triage → Debug → Fixing → Verify.  Throw `BusinessRuleException` (400)
            for backward or skip transitions.
          - `UpdateIssueAsync`: if Status = "Closed", check no Subtask in
            State != "Completed" exists; throw 400 if so.
          - `AdvanceWorkflowAsync` to "Verify" stage: auto-set Status = "Fixed"
            (not "Closed"; Closed requires explicit Status update after verification).

          WorkflowStage string enum: "Triage" | "Debug" | "Fixing" | "Verify"
          Issue.Status string enum:  "Open" | "Fixed" | "Closed" | "Declined"

          `IssueDetailDto` fields: Id, IssueCode, Title, Summary, Severity,
          Priority, Status, WorkflowStage, ReporterUserId, CurrentAssigneeUserId,
          VerifiedByUserId, DueDate, OpenedAt, ResolvedAt, ClosedAt,
          Subtasks (list of SubtaskDto), Steps (list of IssueStepDto).
        </task>

        <!-- ── ISubtasksService ── -->
        <task priority="high">
          Create `backend/src/HorusVis.Business/Contracts/ISubtasksService.cs`:
          ```csharp
          Task&lt;SubtaskDto&gt; CreateSubtaskAsync(CreateSubtaskRequest req, CancellationToken ct);
          Task&lt;SubtaskEffortResponseDto&gt; PatchEffortAsync(Guid subtaskId, PatchEffortRequest req, CancellationToken ct);
          Task&lt;SubtaskDto&gt; UpdateSubtaskAsync(Guid subtaskId, UpdateSubtaskRequest req, CancellationToken ct);
          Task            DeleteSubtaskAsync(Guid subtaskId, CancellationToken ct);
          ```
        </task>
        <task priority="high">
          Create `backend/src/HorusVis.Business/Services/SubtasksService.cs`.

          `PatchEffortAsync`:
          - Updates EstimateHours, ToDoHours, ActualHours from request.
          - Calls `TaskProgressCalculator.Recalculate(taskId)` if subtask has TaskId.
          - Returns `SubtaskEffortResponseDto` with updated effort fields AND
            the recalculated `TaskProgressPercent` (for optimistic FE update).

          `SubtaskDto` fields: Id, SubtaskCode, Title, State, OwnerUserId,
          OwnerFullName, EstimateHours, ToDoHours, ActualHours, DueDate, SortOrder.

          `SubtaskEffortResponseDto`: SubtaskId + all effort fields (EstimateHours,
          ToDoHours, ActualHours) + TaskProgressPercent (nullable — null if subtask
          belongs to an Issue only).
        </task>

        <!-- ── TaskProgressCalculator ── -->
        <task priority="high">
          Create `backend/src/HorusVis.Business/Services/TaskProgressCalculator.cs`
          as a scoped service (registered as `ITaskProgressCalculator`).

          ```csharp
          // Guard division-by-zero; cap at 100
          decimal totalEstimate = subtasks.Sum(s => s.EstimateHours);
          decimal totalActual   = subtasks.Sum(s => s.ActualHours);
          decimal progress = totalEstimate > 0
              ? Math.Min(totalActual / totalEstimate * 100m, 100m)
              : 0m;
          task.ProgressPercent = Math.Round(progress, 2);
          ```

          Signature:
          ```csharp
          Task RecalculateAsync(Guid taskId, CancellationToken ct = default);
          ```
        </task>

        <!-- ── Request/Response DTOs ── -->
        <task priority="medium">
          Create DTO classes in
          `backend/src/HorusVis.Web/Contracts/Requests/` and
          `backend/src/HorusVis.Web/Contracts/Responses/` (or co-locate in
          Business if DTOs are shared with the service layer — follow the
          existing pattern from AuthResult.cs):

          Requests:
            CreateTaskRequest      { ProjectId, Title, Priority, FeatureAreaId?, DueDate?, AssigneeUserIds[] }
            UpdateTaskRequest      { Title?, Priority?, Status?, Description?, DueDate?, AssigneeUserIds[]? }
            MoveTaskRequest        { TargetStatus, TargetBoardRank, BlockedNote? }
            CreateIssueRequest     { TaskId?, ProjectId, Title, Summary, Severity, Priority, DueDate?, CurrentAssigneeUserId? }
            UpdateIssueRequest     { Title?, Summary?, Severity?, Priority?, Status?, DueDate?, CurrentAssigneeUserId?, VerifiedByUserId? }
            AdvanceWorkflowRequest { TargetStage }
            CreateSubtaskRequest   { TaskId?, IssueId?, Title, Description?, OwnerUserId?, EstimateHours, ToDoHours, ActualHours }
            UpdateSubtaskRequest   { Title?, State?, OwnerUserId?, DueDate? }
            PatchEffortRequest     { EstimateHours?, ToDoHours?, ActualHours? }

          Responses:
            MyBoardDto             { ToDo: TaskCardDto[], Working: [], Stuck: [], Done: [] }
            TaskCardDto            { Id, Title, Priority, Status, BoardRank, ProgressPercent, IssueCount, PrimaryAssignee, FeatureAreaName, DueDate }
            TaskDetailDto          (extends TaskCardDto + Description, StartDate, PlanEstimate, AssigneeList, FeatureAreaId, Subtasks[], Issues[])
            IssueSummaryDto        { Id, IssueCode, Title, Priority, Status, WorkflowStage, CurrentAssigneeUserId }
            IssueDetailDto         (extends IssueSummaryDto + all fields)
            SubtaskDto             { Id, SubtaskCode, Title, State, OwnerUserId, OwnerFullName, EstimateHours, ToDoHours, ActualHours, DueDate, SortOrder }
            SubtaskEffortResponseDto { SubtaskId, EstimateHours, ToDoHours, ActualHours, TaskProgressPercent? }
        </task>

        <!-- ── Registration ── -->
        <task priority="medium">
          Register all new services in
          `backend/src/HorusVis.Business/ServiceCollectionExtensions.cs`:
            services.AddScoped&lt;ITasksService, TasksService&gt;();
            services.AddScoped&lt;IIssuesService, IssuesService&gt;();
            services.AddScoped&lt;ISubtasksService, SubtasksService&gt;();
            services.AddScoped&lt;ITaskProgressCalculator, TaskProgressCalculator&gt;();
        </task>
      </tasks>

      <deliverables>
        <deliverable>`HorusVis.Business/Contracts/ITasksService.cs`</deliverable>
        <deliverable>`HorusVis.Business/Contracts/IIssuesService.cs`</deliverable>
        <deliverable>`HorusVis.Business/Contracts/ISubtasksService.cs`</deliverable>
        <deliverable>`HorusVis.Business/Contracts/ITaskProgressCalculator.cs`</deliverable>
        <deliverable>`HorusVis.Business/Services/TasksService.cs`</deliverable>
        <deliverable>`HorusVis.Business/Services/IssuesService.cs`</deliverable>
        <deliverable>`HorusVis.Business/Services/SubtasksService.cs`</deliverable>
        <deliverable>`HorusVis.Business/Services/TaskProgressCalculator.cs`</deliverable>
        <deliverable>IMyTasksService / MyTasksService updated with GetMyBoardAsync</deliverable>
        <deliverable>All Request + Response DTOs</deliverable>
        <deliverable>ServiceCollectionExtensions.cs updated</deliverable>
        <deliverable>Build passes: `dotnet build backend/HorusVis.sln`</deliverable>
      </deliverables>

      <dependencies>Phase 1 (BoardRank column must exist on entity before service queries it).</dependencies>
    </phase>


    <!-- ═══════════════════════════════════════════════════════════════════
         PHASE 3 — BE Controllers
         ═══════════════════════════════════════════════════════════════== -->
    <phase number="3" name="BE Controllers — Tasks, Issues, Subtasks">
      <objective>
        Replace the scaffold `MyTasksController` with a fully functional
        `TasksController` and add new `IssuesController` and `SubtasksController`.
        Controllers are thin: validate input, call service, return result.
        All business rules remain in the service layer.
      </objective>

      <tasks>
        <!-- ── TasksController ── -->
        <task priority="high">
          Replace content of
          `backend/src/HorusVis.Web/Controllers/MyTasksController.cs`
          OR rename the file to `TasksController.cs`.

          Controller: `[ApiController] [Authorize] [Route("api/tasks")]`
          Inject: `IMyTasksService`, `ITasksService`

          Endpoints:
            GET    api/tasks/my-board
              → return Ok(await myTasksService.GetMyBoardAsync(UserId, ct))
              → UserId extracted from JWT claims: User.FindFirst(ClaimTypes.NameIdentifier)

            POST   api/tasks
              → [FromBody] CreateTaskRequest
              → return CreatedAtAction(nameof(GetTask), taskCard)

            GET    api/tasks/{taskId:guid}
              → return Ok(await tasksService.GetTaskDetailAsync(taskId, ct))

            PUT    api/tasks/{taskId:guid}
              → [FromBody] UpdateTaskRequest
              → catch BusinessRuleException → return Problem(title: ex.Message, statusCode: 400)
              → return Ok(result)

            PATCH  api/tasks/{taskId:guid}/move
              → [FromBody] MoveTaskRequest
              → catch BusinessRuleException → return Problem(...)
              → return Ok(result)

            DELETE api/tasks/{taskId:guid}
              → return NoContent()

            GET    api/tasks/{taskId:guid}/issues
              → return Ok(issueList from TaskDetailDto.Issues)

            GET    api/tasks/{taskId:guid}/subtasks
              → return Ok(subtaskList from TaskDetailDto.Subtasks)
        </task>

        <!-- ── IssuesController ── -->
        <task priority="high">
          Create `backend/src/HorusVis.Web/Controllers/IssuesController.cs`

          Controller: `[ApiController] [Authorize] [Route("api/issues")]`
          Inject: `IIssuesService`

          Endpoints:
            POST   api/issues
              → [FromBody] CreateIssueRequest
              → return Created(result)

            GET    api/issues/{issueId:guid}
              → return Ok(await issuesService.GetIssueDetailAsync(issueId, ct))

            PUT    api/issues/{issueId:guid}
              → [FromBody] UpdateIssueRequest
              → catch BusinessRuleException → Problem(400)
              → return Ok(result)

            POST   api/issues/{issueId:guid}/advance-workflow
              → [FromBody] AdvanceWorkflowRequest
              → catch BusinessRuleException → Problem(400)
              → return Ok(updatedSummary)

            DELETE api/issues/{issueId:guid}
              → return NoContent()

            GET    api/issues/{issueId:guid}/subtasks
              → return Ok(subtaskList)

            POST   api/issues/{issueId:guid}/subtasks
              → [FromBody] CreateSubtaskRequest (with IssueId set)
              → return Created(result)
        </task>

        <!-- ── SubtasksController ── -->
        <task priority="high">
          Create `backend/src/HorusVis.Web/Controllers/SubtasksController.cs`

          Controller: `[ApiController] [Authorize] [Route("api/subtasks")]`
          Inject: `ISubtasksService`

          Endpoints:
            POST   api/subtasks
              → [FromBody] CreateSubtaskRequest
              → return Created(result)

            PUT    api/subtasks/{subtaskId:guid}
              → [FromBody] UpdateSubtaskRequest
              → return Ok(result)

            PATCH  api/subtasks/{subtaskId:guid}/effort
              → [FromBody] PatchEffortRequest
              → return Ok(SubtaskEffortResponseDto) ← includes TaskProgressPercent

            DELETE api/subtasks/{subtaskId:guid}
              → return NoContent()
        </task>

        <!-- ── POST api/tasks/{taskId}/subtasks ── -->
        <task priority="medium">
          Add subtask creation under tasks:
            POST api/tasks/{taskId:guid}/subtasks
              → TasksController, [FromBody] CreateSubtaskRequest (TaskId filled server-side)
              → Delegates to ISubtasksService.CreateSubtaskAsync
        </task>

        <!-- ── BusinessRuleException ── -->
        <task priority="medium">
          Define `BusinessRuleException` in HorusVis.Business (or HorusVis.Core):
          ```csharp
          public sealed class BusinessRuleException(string message) : Exception(message);
          ```
          Register a global exception filter or minimal-API middleware in
          `HorusVis.Web/Program.cs` to convert `BusinessRuleException` → 400
          ProblemDetails automatically (avoiding try/catch repetition in
          controllers).
        </task>

        <!-- ── UserId helper ── -->
        <task priority="medium">
          Add a `ControllerBase` extension or base class `HorusVisControllerBase`
          that exposes a `CurrentUserId` property:
          ```csharp
          protected Guid CurrentUserId =>
              Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
          ```
          All three controllers inherit from this base.
        </task>
      </tasks>

      <deliverables>
        <deliverable>`HorusVis.Web/Controllers/TasksController.cs` (replaces MyTasksController scaffold)</deliverable>
        <deliverable>`HorusVis.Web/Controllers/IssuesController.cs`</deliverable>
        <deliverable>`HorusVis.Web/Controllers/SubtasksController.cs`</deliverable>
        <deliverable>`BusinessRuleException.cs` in Business or Core project</deliverable>
        <deliverable>`HorusVisControllerBase.cs` (or extension method)</deliverable>
        <deliverable>Build passes; `dotnet run` starts API without errors</deliverable>
        <deliverable>Manual verification: `GET /api/tasks/my-board` returns 200 (empty board)</deliverable>
      </deliverables>

      <dependencies>Phase 2 (services must exist before controllers inject them).</dependencies>
    </phase>


    <!-- ═══════════════════════════════════════════════════════════════════
         PHASE 4 — FE Foundation: Packages + HTTP Client + API Types
         ═══════════════════════════════════════════════════════════════== -->
    <phase number="4" name="FE Foundation — Packages, API Client, Types">
      <objective>
        Install required packages, wire TanStack Query into the app root,
        enhance the existing fetch-based httpClient with Bearer auth, and
        define full TypeScript types + API service functions consumed by
        future phases.
      </objective>

      <tasks>
        <!-- ── Install packages ── -->
        <task priority="high">
          Run in `frontend/horusvis-react/`:
          ```
          npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities \
                      @tanstack/react-query \
                      react-hook-form \
                      zustand \
                      sonner
          ```
          Confirm versions in package.json after install.
          (Do NOT install axios — the existing fetch-based httpClient is retained.)
        </task>

        <!-- ── TanStack Query setup ── -->
        <task priority="high">
          In `frontend/horusvis-react/src/main.tsx`:
          - Import `QueryClient`, `QueryClientProvider` from `@tanstack/react-query`
          - Create:
            ```ts
            const queryClient = new QueryClient({
              defaultOptions: { queries: { staleTime: 2 * 60_000, retry: 1 } }
            });
            ```
          - Wrap `&lt;App /&gt;` with `&lt;QueryClientProvider client={queryClient}&gt;`
        </task>

        <!-- ── httpClient auth enhancement ── -->
        <task priority="high">
          Extend `frontend/horusvis-react/src/api/httpClient.ts`:
          - Add `getAccessToken(): string | null` helper that reads from
            `localStorage` (key matching the one set during login in Task 01).
          - Add `apiPost`, `apiPut`, `apiPatch`, `apiDelete` helpers that:
            - Inject `Authorization: Bearer &lt;token&gt;` header when token is present
            - Accept a typed body parameter
            - Throw a typed `ApiError` on non-2xx responses (include status +
              ProblemDetails shape)
          - Update `apiGet` to also inject the auth header.
          - Export `ApiError` class:
            ```ts
            export class ApiError extends Error {
              constructor(public status: number, public detail: string) { super(detail); }
            }
            ```
        </task>

        <!-- ── TypeScript types ── -->
        <task priority="high">
          Create `frontend/horusvis-react/src/api/taskTypes.ts` with all
          request/response types mirroring the BE DTOs:

          ```ts
          // ── Status / Enum strings ──────────────────────────────────
          export type TaskStatus       = 'ToDo' | 'Working' | 'Stuck' | 'Done';
          export type IssuePriority    = 'Low' | 'Medium' | 'High' | 'Critical';
          export type IssueSeverity    = 'Minor' | 'Major' | 'Critical' | 'Blocker';
          export type IssueStatus      = 'Open' | 'Fixed' | 'Closed' | 'Declined';
          export type WorkflowStage    = 'Triage' | 'Debug' | 'Fixing' | 'Verify';
          export type SubtaskState     = 'ToDo' | 'InProgress' | 'Completed';

          // ── Board ──────────────────────────────────────────────────
          export interface TaskCardDto { id: string; title: string; priority: string; status: TaskStatus; boardRank: number; progressPercent: number; issueCount: number; primaryAssignee: AssigneeSummary | null; featureAreaName: string | null; dueDate: string | null; }
          export interface AssigneeSummary { userId: string; fullName: string; avatarUrl: string | null; }
          export interface MyBoardDto { toDo: TaskCardDto[]; working: TaskCardDto[]; stuck: TaskCardDto[]; done: TaskCardDto[]; }

          // ── Task Detail ────────────────────────────────────────────
          export interface TaskDetailDto extends TaskCardDto { description: string | null; startDate: string | null; planEstimate: number | null; featureAreaId: string | null; assigneeList: AssigneeSummary[]; subtasks: SubtaskDto[]; issues: IssueSummaryDto[]; }

          // ── Issue ──────────────────────────────────────────────────
          export interface IssueSummaryDto { id: string; issueCode: string; title: string; priority: IssuePriority; status: IssueStatus; workflowStage: WorkflowStage; currentAssigneeUserId: string | null; }
          export interface IssueDetailDto extends IssueSummaryDto { summary: string; severity: IssueSeverity; reporterUserId: string; verifiedByUserId: string | null; dueDate: string | null; openedAt: string; resolvedAt: string | null; closedAt: string | null; subtasks: SubtaskDto[]; steps: IssueStepDto[]; }
          export interface IssueStepDto { id: string; stepOrder: number; actionText: string; expectedResult: string | null; actualResult: string | null; }

          // ── Subtask ────────────────────────────────────────────────
          export interface SubtaskDto { id: string; subtaskCode: string; title: string; state: SubtaskState; ownerUserId: string | null; ownerFullName: string | null; estimateHours: number; toDoHours: number; actualHours: number; dueDate: string | null; sortOrder: number; }
          export interface SubtaskEffortResponseDto { subtaskId: string; estimateHours: number; toDoHours: number; actualHours: number; taskProgressPercent: number | null; }

          // ── Requests ───────────────────────────────────────────────
          export interface CreateTaskRequest { projectId: string; title: string; priority: string; featureAreaId?: string; dueDate?: string; assigneeUserIds?: string[]; }
          export interface UpdateTaskRequest { title?: string; priority?: string; status?: TaskStatus; description?: string; dueDate?: string; }
          export interface MoveTaskRequest { targetStatus: TaskStatus; targetBoardRank: number; blockedNote?: string; }
          export interface PatchEffortRequest { estimateHours?: number; toDoHours?: number; actualHours?: number; }
          export interface CreateIssueRequest { taskId?: string; projectId: string; title: string; summary: string; severity: IssueSeverity; priority: IssuePriority; dueDate?: string; currentAssigneeUserId?: string; }
          export interface AdvanceWorkflowRequest { targetStage: WorkflowStage; }
          export interface CreateSubtaskRequest { taskId?: string; issueId?: string; title: string; description?: string; ownerUserId?: string; estimateHours: number; toDoHours: number; actualHours: number; }
          ```
        </task>

        <!-- ── API service functions ── -->
        <task priority="high">
          Create `frontend/horusvis-react/src/api/tasksApi.ts`:
          ```ts
          export const tasksApi = {
            getMyBoard:   ()                        => apiGet&lt;MyBoardDto&gt;('/api/tasks/my-board'),
            getTaskDetail:(id: string)              => apiGet&lt;TaskDetailDto&gt;(`/api/tasks/${id}`),
            createTask:   (req: CreateTaskRequest)  => apiPost&lt;TaskCardDto&gt;('/api/tasks', req),
            updateTask:   (id: string, req: UpdateTaskRequest) => apiPut&lt;TaskCardDto&gt;(`/api/tasks/${id}`, req),
            moveTask:     (id: string, req: MoveTaskRequest)   => apiPatch&lt;TaskCardDto&gt;(`/api/tasks/${id}/move`, req),
            deleteTask:   (id: string)              => apiDelete(`/api/tasks/${id}`),
          };
          ```

          Create `frontend/horusvis-react/src/api/issuesApi.ts`:
          ```ts
          export const issuesApi = {
            getIssueDetail:    (id: string)                       => apiGet&lt;IssueDetailDto&gt;(`/api/issues/${id}`),
            createIssue:       (req: CreateIssueRequest)          => apiPost&lt;IssueSummaryDto&gt;('/api/issues', req),
            updateIssue:       (id: string, req: UpdateIssueRequest) => apiPut&lt;IssueSummaryDto&gt;(`/api/issues/${id}`, req),
            advanceWorkflow:   (id: string, req: AdvanceWorkflowRequest) => apiPost&lt;IssueSummaryDto&gt;(`/api/issues/${id}/advance-workflow`, req),
            deleteIssue:       (id: string)                       => apiDelete(`/api/issues/${id}`),
            createSubtask:     (issueId: string, req: CreateSubtaskRequest) => apiPost&lt;SubtaskDto&gt;(`/api/issues/${issueId}/subtasks`, req),
          };
          ```

          Create `frontend/horusvis-react/src/api/subtasksApi.ts`:
          ```ts
          export const subtasksApi = {
            createSubtask: (req: CreateSubtaskRequest)          => apiPost&lt;SubtaskDto&gt;('/api/subtasks', req),
            updateSubtask: (id: string, req: UpdateSubtaskRequest) => apiPut&lt;SubtaskDto&gt;(`/api/subtasks/${id}`, req),
            patchEffort:   (id: string, req: PatchEffortRequest) => apiPatch&lt;SubtaskEffortResponseDto&gt;(`/api/subtasks/${id}/effort`, req),
            deleteSubtask: (id: string)                          => apiDelete(`/api/subtasks/${id}`),
          };
          ```
        </task>

        <!-- ── localStorage key alignment ── -->
        <task priority="low">
          Confirm the `localStorage` key used to store the access token during
          login (from Task 01 implementation) and use the same key in
          `getAccessToken()`.  Document the key in a comment in httpClient.ts.
        </task>
      </tasks>

      <deliverables>
        <deliverable>`package.json` updated with dnd-kit, TanStack Query, react-hook-form, zustand, sonner</deliverable>
        <deliverable>`src/main.tsx` wrapped with QueryClientProvider</deliverable>
        <deliverable>`src/api/httpClient.ts` enhanced with auth headers + apiPost/Put/Patch/Delete</deliverable>
        <deliverable>`src/api/taskTypes.ts` — all TypeScript types</deliverable>
        <deliverable>`src/api/tasksApi.ts`</deliverable>
        <deliverable>`src/api/issuesApi.ts`</deliverable>
        <deliverable>`src/api/subtasksApi.ts`</deliverable>
        <deliverable>No TypeScript compilation errors: `npm run build`</deliverable>
      </deliverables>

      <dependencies>Phase 3 (APIs must be defined before FE calls are wired up, though types can be created independently).</dependencies>
    </phase>


    <!-- ═══════════════════════════════════════════════════════════════════
         PHASE 5 — FE Kanban Board
         ═══════════════════════════════════════════════════════════════== -->
    <phase number="5" name="FE Kanban Board — Store, Board, Columns, Cards">
      <objective>
        Implement the Kanban board: Zustand store, 4-column layout with
        dnd-kit drag-and-drop, TaskCard, TaskFilterBar, NewTaskModal.
        Replace the MyTasksPage placeholder with the working board.
      </objective>

      <tasks>
        <!-- ── myTasksStore ── -->
        <task priority="high">
          Create `frontend/horusvis-react/src/stores/myTasksStore.ts`:
          ```ts
          interface MyTasksState {
            selectedTaskId:  string | null;
            filters:         { status: TaskStatus | 'all'; priority: string | 'all'; projectId: string | null };
            setSelectedTask: (id: string | null) => void;
            setFilters:      (f: Partial&lt;MyTasksState['filters']&gt;) => void;
          }

          export const useMyTasksStore = create&lt;MyTasksState&gt;((set) => ({
            selectedTaskId: null,
            filters: { status: 'all', priority: 'all', projectId: null },
            setSelectedTask: (id) => set({ selectedTaskId: id }),
            setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
          }));
          ```
        </task>

        <!-- ── KanbanBoard ── -->
        <task priority="high">
          Create `frontend/horusvis-react/src/components/tasks/KanbanBoard.tsx`:
          - Uses `useQuery({ queryKey: ['my-board'], queryFn: tasksApi.getMyBoard })`
          - Uses `DndContext` from `@dnd-kit/core` with `PointerSensor`
          - `onDragEnd` handler:
            - Determines target column from `over.id` (column id = status string)
            - Calls `tasksApi.moveTask(activeId, { targetStatus, targetBoardRank })`
              where targetBoardRank is computed as midpoint between adjacent cards
            - Optimistically updates QueryClient data before awaiting mutation
            - Reverts on error via `onError` callback
          - Renders 4 `&lt;KanbanColumn /&gt;` components
          - Filters applied from `useMyTasksStore().filters`
        </task>

        <!-- ── KanbanColumn ── -->
        <task priority="high">
          Create `frontend/horusvis-react/src/components/tasks/KanbanColumn.tsx`:
          Props: `{ columnId: TaskStatus; title: string; tasks: TaskCardDto[]; }`
          - Uses `SortableContext` (from `@dnd-kit/sortable`) with `verticalListSortingStrategy`
          - Uses `useDroppable({ id: columnId })` to make column accept drops
          - Renders column header (title + card count badge)
          - Maps tasks to `&lt;SortableTaskCard /&gt;` (thin wrapper providing drag handle)
          - Column header colors:
            ToDo = blue-600, Working = amber-600, Stuck = red-600, Done = green-600
        </task>

        <!-- ── TaskCard ── -->
        <task priority="high">
          Create `frontend/horusvis-react/src/components/tasks/TaskCard.tsx`:
          Props: `{ task: TaskCardDto; isSelected: boolean; onClick: () => void; }`
          - Priority badge (colored dot): Critical=red, High=orange, Medium=yellow, Low=grey
          - Assignee avatar (avatar URL or initials fallback)
          - Progress bar: `&lt;progress value={task.progressPercent} max={100} /&gt;`
            label shows "N%" — derived from server-provided value (not FE-computed)
          - Issue count badge: only shown if issueCount &gt; 0, red pill
          - Active state: ring/border highlight when `isSelected`
          - DueDate shown as relative ("3d left") when within 7 days
          - On click: `useMyTasksStore().setSelectedTask(task.id)`
        </task>

        <!-- ── TaskFilterBar ── -->
        <task priority="high">
          Create `frontend/horusvis-react/src/components/tasks/TaskFilterBar.tsx`:
          - Status filter: "All" | "To Do" | "Working" | "Stuck" | "Done"
          - Priority filter: "All" | "Low" | "Medium" | "High" | "Critical"
          - Project filter: dropdown populated from a minimal project list query
            (`GET /api/projects` — reuse ProjectsService from Task 02 if available,
            otherwise a simple `apiGet&lt;{id,name}[]&gt;('/api/projects')`)
          - Filters drive `useMyTasksStore().setFilters()`; KanbanBoard reads filters
            and passes filtered task arrays to each KanbanColumn
        </task>

        <!-- ── NewTaskModal ── -->
        <task priority="high">
          Create `frontend/horusvis-react/src/components/tasks/NewTaskModal.tsx`:
          Uses React Hook Form v7:
          ```ts
          const { register, handleSubmit, reset } = useForm&lt;CreateTaskRequest&gt;({
            defaultValues: { priority: 'Medium' }
          });
          ```
          Fields: Title (required), Project (select), Priority (select),
          FeatureArea (select — populated from selected project), DueDate (date input).
          On submit: `tasksApi.createTask(data)` → `queryClient.invalidateQueries(['my-board'])`
          On success: `toast.success('Task created')` (sonner), close modal, reset form.
          On error: `toast.error(err.detail)`
        </task>

        <!-- ── MyTasksPage replacement ── -->
        <task priority="high">
          Replace `frontend/horusvis-react/src/pages/MyTasksPage.tsx` content:
          ```tsx
          export default function MyTasksPage() {
            return (
              &lt;div className="flex flex-col h-full"&gt;
                &lt;TaskFilterBar /&gt;
                &lt;KanbanBoard /&gt;
                &lt;TaskDetailDrawer /&gt;  {/* rendered but hidden until selectedTaskId is set */}
              &lt;/div&gt;
            );
          }
          ```
          Add `&lt;Toaster /&gt;` from sonner to the root layout if not already present.
        </task>
      </tasks>

      <deliverables>
        <deliverable>`src/stores/myTasksStore.ts`</deliverable>
        <deliverable>`src/components/tasks/KanbanBoard.tsx`</deliverable>
        <deliverable>`src/components/tasks/KanbanColumn.tsx`</deliverable>
        <deliverable>`src/components/tasks/TaskCard.tsx`</deliverable>
        <deliverable>`src/components/tasks/TaskFilterBar.tsx`</deliverable>
        <deliverable>`src/components/tasks/NewTaskModal.tsx`</deliverable>
        <deliverable>`src/pages/MyTasksPage.tsx` (replaced)</deliverable>
        <deliverable>Drag-and-drop between columns works; position PATCH fires after drop</deliverable>
        <deliverable>No TypeScript errors; `npm run build` passes</deliverable>
      </deliverables>

      <dependencies>Phase 4 (api functions, types, and TanStack Query must be available).</dependencies>
    </phase>


    <!-- ═══════════════════════════════════════════════════════════════════
         PHASE 6 — FE Detail Views: TaskDrawer, SubtaskTable, Issue flows
         ═══════════════════════════════════════════════════════════════== -->
    <phase number="6" name="FE Detail Views — Drawer, SubtaskTable, Issue Flows">
      <objective>
        Implement TaskDetailDrawer (slide-in panel), inline-editable SubtaskTable,
        IssueListPanel inside the drawer, IssueDetailPage, FixingWorkflowStepper,
        and ReportIssueForm.  Activity log and comments are deferred post-MVP.
      </objective>

      <tasks>
        <!-- ── TaskDetailDrawer ── -->
        <task priority="high">
          Create `frontend/horusvis-react/src/components/tasks/TaskDetailDrawer.tsx`:
          - Renders as a slide-in panel from the right (CSS transform, z-index layer)
          - Visible when `useMyTasksStore().selectedTaskId !== null`
          - Fetches: `useQuery({ queryKey: ['task', selectedTaskId], queryFn: () => tasksApi.getTaskDetail(selectedTaskId!) })`
          - Sections:
            1. Header: title (inline-editable text), priority badge, status pill
            2. Meta row: assignees, dueDate, featureArea, project
            3. Progress bar (from `task.progressPercent`) with percentage label
            4. `&lt;SubtaskTable subtasks={task.subtasks} taskId={task.id} /&gt;`
            5. `&lt;IssueListPanel issues={task.issues} taskId={task.id} /&gt;`
          - Close button: `setSelectedTask(null)`
          - Inline title edit: `onBlur` fires `tasksApi.updateTask(id, { title })`
            then `queryClient.invalidateQueries(['my-board'])`
        </task>

        <!-- ── SubtaskTable ── -->
        <task priority="high">
          Create `frontend/horusvis-react/src/components/subtasks/SubtaskTable.tsx`:
          Props: `{ subtasks: SubtaskDto[]; taskId: string; }`
          - Uses `useFieldArray` from React Hook Form v7 with `control` from
            `useForm({ defaultValues: { subtasks } })`
          - Table columns: Rank | ID (SubtaskCode) | Name | State | Owner |
            To Do (hrs) | Actual (hrs) | Estimate (hrs)
          - SubtaskCode and Rank are display-only (no edit)
          - State shown as `&lt;SubtaskStateBadge state={s.state} /&gt;`
          - To Do / Actual / Estimate columns: `&lt;SubtaskEffortEditor /&gt;`
          - "Add subtask" row at the bottom triggers inline creation row
          - Header "Add subtask" button as fallback
        </task>

        <!-- ── SubtaskEffortEditor ── -->
        <task priority="high">
          Create `frontend/horusvis-react/src/components/subtasks/SubtaskEffortEditor.tsx`:
          Props: `{ subtaskId: string; field: 'estimateHours' | 'toDoHours' | 'actualHours'; initialValue: number; onUpdate: (resp: SubtaskEffortResponseDto) => void; }`
          - Renders a number input
          - `onBlur` (debounced 300ms): fires `subtasksApi.patchEffort(subtaskId, { [field]: value })`
          - On success: calls `onUpdate(resp)` → parent updates `task.progressPercent` optimistically
          - On error: revert to `initialValue`, `toast.error(...)`
        </task>

        <!-- ── SubtaskStateBadge ── -->
        <task priority="medium">
          Create `frontend/horusvis-react/src/components/subtasks/SubtaskStateBadge.tsx`:
          Props: `{ state: SubtaskState }`
          Simple colored chip: ToDo=grey, InProgress=blue, Completed=green.
        </task>

        <!-- ── SubtaskRow ── -->
        <task priority="medium">
          Create `frontend/horusvis-react/src/components/subtasks/SubtaskRow.tsx`:
          Renders a single `&lt;tr&gt;` row — used by SubtaskTable.
          Receives the field array item + index from useFieldArray.
        </task>

        <!-- ── IssueListPanel ── -->
        <task priority="high">
          Create `frontend/horusvis-react/src/components/issues/IssueListPanel.tsx`:
          Props: `{ issues: IssueSummaryDto[]; taskId: string; }`
          - Renders a compact list of `&lt;IssueCard /&gt;` components
          - "Report New Issue" button opens `&lt;ReportIssueForm /&gt;` inline or as modal
          - Clicking an issue card navigates to `IssueDetailPage` (`/issues/:issueId`)
        </task>

        <!-- ── IssueCard ── -->
        <task priority="medium">
          Create `frontend/horusvis-react/src/components/issues/IssueCard.tsx`:
          Props: `{ issue: IssueSummaryDto; onClick: () => void; }`
          - Shows: IssueCode, title, priority badge, status chip, workflow stage pill
          - Severity icon (critical = red warning, major = orange)
        </task>

        <!-- ── IssueDetailPage ── -->
        <task priority="high">
          Create `frontend/horusvis-react/src/components/issues/IssueDetailPage.tsx`
          (rendered at route `/issues/:issueId` — add route to router config).
          - Fetches: `useQuery({ queryKey: ['issue', issueId], queryFn: () => issuesApi.getIssueDetail(issueId) })`
          - Sections:
            1. Header: IssueCode + title, severity badge, priority badge, status
            2. `&lt;FixingWorkflowStepper stage={issue.workflowStage} issueId={issue.id} /&gt;`
            3. Summary / description
            4. Steps to reproduce list (read-only for MVP)
            5. `&lt;SubtaskTable subtasks={issue.subtasks} /&gt;` (taskId omitted — issue subtasks)
          - Back button or breadcrumb to parent task
        </task>

        <!-- ── FixingWorkflowStepper ── -->
        <task priority="high">
          Create `frontend/horusvis-react/src/components/issues/FixingWorkflowStepper.tsx`:
          Props: `{ stage: WorkflowStage; issueId: string; }`
          - 4-step horizontal stepper: Triage → Debug → Fixing → Verify
          - Current stage highlighted; completed stages greyed-out/checked
          - "Advance to next stage" button (disabled if already at Verify)
          - On click: calls `issuesApi.advanceWorkflow(issueId, { targetStage: nextStage })`
            then `queryClient.invalidateQueries(['issue', issueId])`
          - Error → `toast.error(err.detail)` (covers business rule rejections)
          - Stage → WorkflowStage transition map (forward-only, validated also on BE):
            Triage → Debug → Fixing → Verify
        </task>

        <!-- ── ReportIssueForm ── -->
        <task priority="high">
          Create `frontend/horusvis-react/src/components/issues/ReportIssueForm.tsx`:
          Uses React Hook Form v7:
          Fields: Title (required), Summary (textarea), Severity (select),
          Priority (select), Assignee (user search/select), DueDate.
          On submit: `issuesApi.createIssue({ ...data, taskId })`
          → `queryClient.invalidateQueries(['task', taskId])`
          → `toast.success('Issue reported')`
          Hidden `taskId` passed from `IssueListPanel`.
        </task>

        <!-- ── Route registration ── -->
        <task priority="medium">
          Register `IssueDetailPage` route.  Find where routes are defined
          (likely `src/app/` or `App.tsx`) and add:
          `&lt;Route path="/issues/:issueId" element={&lt;IssueDetailPage /&gt;} /&gt;`
        </task>
      </tasks>

      <deliverables>
        <deliverable>`src/components/tasks/TaskDetailDrawer.tsx`</deliverable>
        <deliverable>`src/components/subtasks/SubtaskTable.tsx`</deliverable>
        <deliverable>`src/components/subtasks/SubtaskRow.tsx`</deliverable>
        <deliverable>`src/components/subtasks/SubtaskStateBadge.tsx`</deliverable>
        <deliverable>`src/components/subtasks/SubtaskEffortEditor.tsx`</deliverable>
        <deliverable>`src/components/issues/IssueListPanel.tsx`</deliverable>
        <deliverable>`src/components/issues/IssueCard.tsx`</deliverable>
        <deliverable>`src/components/issues/IssueDetailPage.tsx`</deliverable>
        <deliverable>`src/components/issues/FixingWorkflowStepper.tsx`</deliverable>
        <deliverable>`src/components/issues/ReportIssueForm.tsx`</deliverable>
        <deliverable>Issue detail route registered at `/issues/:issueId`</deliverable>
        <deliverable>Inline subtask effort edit fires PATCH; progress bar updates</deliverable>
        <deliverable>Issue workflow stepper advances through 4 stages</deliverable>
        <deliverable>No TypeScript errors; full build passes</deliverable>
      </deliverables>

      <dependencies>Phase 5 (TaskDetailDrawer is mounted inside MyTasksPage; IssueListPanel uses myTasksStore context).</dependencies>
    </phase>

  </phases>

  <metadata>
    <confidence level="high">
      DB schema confirmed from InitialCreate migration — all required tables
      (Tasks, Issues, Subtasks, TaskAssignees, IssueActivities) exist.
      Scaffold interfaces (IMyTasksService, MyTasksController) verified as empty.
      Frontend packages confirmed absent from package.json — install required.
      Business rule constraints verified from spec and research docs.
    </confidence>

    <dependencies>
      1. ✅ DB schema (Tasks, Issues, Subtasks, TaskAssignees) — from Task 00
      2. ✅ Auth (JWT bearer + refresh cookie) — from Task 01
      3. ✅ DAO + UoW pattern — established from Task 01
      4. ✅ Frontend scaffolding (pages, router, httpClient) — exists
      5. ⚠️ dnd-kit, TanStack Query, react-hook-form, zustand, sonner — NOT installed (Phase 4)
      6. ⚠️ httpClient missing auth header injection — fix in Phase 4
      7. ⚠️ Tasks entity missing BoardRank column — add in Phase 1
      8. ⚠️ Subtasks entity missing SortOrder column — add in Phase 1
    </dependencies>

    <open_questions>
      1. What is the exact TaskAssignees.AssignmentType value for the "primary" assignee?
         (e.g., "Primary", "Owner", "Lead")  This affects the TaskCardDto primary
         assignee query in MyTasksService.GetMyBoardAsync.

      2. What localStorage key does Task 01 use for the access token?
         Required to wire the auth header in httpClient.ts.

      3. Should `Tasks.Status = "Stuck"` be auto-set by the backend when an open
         Critical severity issue is linked (BE-driven),OR is it always set manually
         by the user via drag to the Stuck column (user-driven)?
         The spec mentions both; the plan defaults to user-driven with an optional
         BE guard.

      4. Does `IssueDetailPage` need its own route (`/issues/:issueId`) or is it
         a nested view within `MyTasksPage` (`/my-tasks?issue=xxx`)?
         Plan defaults to a standalone route.

      5. The `SubtaskTable` columns spec includes "Project" — but Subtasks do not
         have a ProjectId column directly (inherited via Task or Issue).
         Confirm: should "Project" column show the parent Task's ProjectName?
    </open_questions>

    <assumptions>
      - Tasks.Status string values are exactly: "ToDo", "Working", "Stuck", "Done"
      - Issues.WorkflowStage string values are: "Triage", "Debug", "Fixing", "Verify"
      - Issues.Status string values are: "Open", "Fixed", "Closed", "Declined"
      - Subtasks.State string values are: "ToDo", "InProgress", "Completed"
      - TaskAssignees contains a "Primary" or "Owner" AssignmentType for the lead assignee
      - Cross-project Kanban drag is out of scope for MVP
      - Activity log / comments tables exist in DB (IssueActivities, TaskComments) but
        are NOT exposed in any endpoint for MVP — deferred post-MVP
      - `frontend/horusvis-react/` has Tailwind CSS or equivalent utility-first CSS configured
      - Router is React Router v6+ (route definition syntax uses `&lt;Route&gt;` JSX)
      - `sonner` Toaster is added to the root layout once (not per-page)
    </assumptions>
  </metadata>

</plan>
