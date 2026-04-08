<objective>
Create an implementation plan for Task 03 — My Tasks page of HorusVis.

Purpose: Break the My Tasks workstream into ordered, implementable phases so subsequent Do prompts can execute each phase independently.
Input: Research findings from 008-task-mgmt-research, task spec from docs/outlines/tasks/03-my-tasks/README.md
Output: `.prompts/010-my-tasks-plan/my-tasks-plan.md`
</objective>

<context>
Research findings: @.prompts/008-task-mgmt-research/task-mgmt-research.md
Task spec: @docs/outlines/tasks/03-my-tasks/README.md

Key research decisions to incorporate:
- **Drag-and-drop**: `@dnd-kit/sortable` (NOT react-beautiful-dnd — archived)
- **4 Kanban columns**: To Do | Working | Stuck | Done
- **Issue workflow stepper**: Triage → Debug → Fixing → Verify (linear, forward-only)
- **Subtask effort table columns**: Rank | ID | Name | State | Owner | Project | To Do (hrs) | Actual (hrs) | Estimate (hrs)
- **Inline edit**: React Hook Form v7 `useFieldArray` + debounced `onBlur` PATCH
- **Progress formula**: `SUM(ActualHours) / SUM(EstimateHours)` — server computed, optimistic update on FE
- **Business rules enforced by BE**:
  - Task → Done blocked if open issues or incomplete subtasks exist
  - Issue → Closed blocked if incomplete subtasks exist
- **TanStack Query v5** for all data; optimistic mutations for subtask edits
- **Zustand** store for myTasksStore (board state, selected task ID, filters)

Stack: React 18 + TypeScript + Vite | ASP.NET Core 10 Web API | EF Core 10 | PostgreSQL (schema "horusvis")
Auth: Bearer token — all endpoints require [Authorize]; board is scoped to current user (from JWT claims)
DAO + UoW pattern already established — new services use DAOs, controllers call SaveChangesAsync
</context>

<planning_requirements>
The plan must cover:

**Backend phases first**:
1. DAO/Repository layer: TaskDao, IssueDao, SubtaskDao (if not already in Data project)
2. Service layer:
   - TasksService: CRUD + status transitions + ProgressPercent recalculation
   - IssuesService: CRUD + workflow status transitions
   - SubtasksService: CRUD + effort update + trigger task progress recalc
   - TaskProgressCalculator: SUM(Actual) / SUM(Estimate) — service or domain method
3. Controllers:
   - TasksController: GET my-board, POST/GET/PUT/DELETE tasks
   - IssuesController: GET/POST/PUT/DELETE issues + workflow transition endpoint
   - SubtasksController: GET/POST/PATCH subtasks (PATCH for effort inline edit)
4. Business rule enforcement in service layer (not controller layer)

**Frontend phases after BE**:
5. API service layer: tasksApi.ts, issuesApi.ts, subtasksApi.ts + TS types
6. myTasksStore (Zustand): board state, selectedTaskId, filters, optimistic updates
7. KanbanBoard + KanbanColumn (dnd-kit/sortable) — 4 columns, card rendering
8. TaskCard: priority badge, assignee avatar, progress bar, issue count, active state
9. NewTaskModal + TaskFilterBar + drag-position PATCH
10. TaskDetailDrawer: task info + subtask table + related issues panel
11. SubtaskTable: inline editable effort columns (React Hook Form useFieldArray)
12. IssueListPanel + IssueCard (inside TaskDetailDrawer)
13. IssueDetailPage: full issue view + FixingWorkflowStepper
14. ReportIssueForm + SubtaskStateBadge + SubtaskEffortEditor

Constraints:
- Activity log / comments: defer to post-MVP unless explicitly required
- Cross-project Kanban drag: not in scope; each board is user-scoped
- SubtaskCode / IssueCode: display-only computed fields (no edit)
- Stuck column: auto-set when a task has an open critical issue (BE logic)

Success criteria:
- Users can move tasks between columns using drag-and-drop
- SubtaskTable edits update effort and recompute task progress
- Business rules block invalid status transitions with clear 400 error messages
- Issue workflow stepper advances through 4 states
- Build passes, no TypeScript errors
</planning_requirements>

<output_structure>
Save to: `.prompts/010-my-tasks-plan/my-tasks-plan.md`

Use the XML plan structure:
```xml
<plan>
  <summary>...</summary>
  <phases>
    <phase number="N" name="...">
      <objective>...</objective>
      <tasks>
        <task priority="high|medium|low">...</task>
      </tasks>
      <deliverables>
        <deliverable>...</deliverable>
      </deliverables>
      <dependencies>...</dependencies>
    </phase>
  </phases>
  <metadata>
    <confidence level="high|medium|low">...</confidence>
    <dependencies>...</dependencies>
    <open_questions>...</open_questions>
    <assumptions>...</assumptions>
  </metadata>
</plan>
```

Aim for 5–7 phases. Each phase completable in a single Do prompt.
</output_structure>

<summary_requirements>
Create `.prompts/010-my-tasks-plan/SUMMARY.md` with:
- One-liner
- Phase breakdown table
- Decisions Needed
- Blockers
- Next Step

---
*Confidence: High|Medium|Low*
*Full output: my-tasks-plan.md*
</summary_requirements>
