<session_initialization>
Before beginning research, verify today's date:
!`date +%Y-%m-%d`

Use this date when evaluating "current" or "recommended" patterns.
</session_initialization>

<research_objective>
Research lightweight task management app implementation patterns to inform the next 4 workstreams of HorusVis:
- 02-projects (project list, board, overview, team management)
- 03-my-tasks (Kanban board, Task/Issue/Subtask, progress from effort)
- 04-reports (KPI cards, bug density, team performance analytics)
- 05-admin (user management, role/scope, session monitoring, system health)

Purpose: Identify proven patterns, component architectures, API contracts, and UX conventions for a React + ASP.NET Core 10 task management SaaS, so the subsequent plan and implementation prompts are grounded in real-world practice.

Scope: Frontend (React + TypeScript), Backend (ASP.NET Core 10 Web API), patterns applicable to all 4 remaining workstreams.
Output: `.prompts/008-task-mgmt-research/task-mgmt-research.md` with structured findings.
</research_objective>

<project_context>
@docs/outlines/tasks/README.md
@docs/outlines/tasks/02-projects/README.md
@docs/outlines/tasks/03-my-tasks/README.md
@docs/outlines/tasks/04-reports/README.md
@docs/outlines/tasks/05-admin/README.md

**Stack**:
- Frontend: React 18+, TypeScript, Vite, TailwindCSS (or similar), Zustand/Context for state
- Backend: ASP.NET Core 10, EF Core 10, PostgreSQL, JWT bearer auth (already implemented)
- Auth: Bearer access token (15 min) + httpOnly refresh token cookie (done — task 01 complete)
- DB: UUID PKs, schema `horusvis`, key tables: Users, Roles, Projects, Tasks, Issues, Subtasks, UserSessions, ReportSnapshots

**Completed**:
- Task 00: Full DB schema with migrations — all tables exist
- Task 01: Auth system — login/register/refresh/logout fully implemented with DAO + UoW pattern

**Remaining workstreams (02–05)** are the scope of this research.

**Task 03 special rules** (from task spec):
- `Task.ProgressPercent = SUM(ActualHours) / SUM(EstimateHours)` across subtasks
- Task cannot move to Done if open issues or incomplete subtasks exist
- Issue cannot close if subtasks incomplete
- Kanban columns: To Do → Working → Stuck → Done
- Issue workflow: Triage → Debug → Fixing → Verify

**Task 05 requirements**: admin-only endpoints, session monitoring from UserSessions table, system node health, deployment history
</project_context>

<research_scope>
<include>

**1. Kanban Board (task 03)**
- React Kanban patterns: drag-and-drop libraries (dnd-kit vs react-beautiful-dnd), performance with 50–200 cards
- Subtask effort table UI: inline editing of EstimateHours / ToDoHours / ActualHours
- Progress bar from computed ratio — live vs server-side
- Task/Issue/Subtask hierarchy: recommended component decomposition
- Backend: PATCH vs PUT for partial task updates; optimistic updates on frontend

**2. Project Management (task 02)**
- Project list + board + overview tab pattern in React SPA
- Team member management UI: avatar groups, role assignment
- FeatureArea tagging on tasks — filter/tag patterns
- Backend: query patterns for project overview (velocity, critical dates, team availability) without over-fetching

**3. Analytics/Reports (task 04)**
- Lightweight charting libraries for React (Recharts vs Chart.js vs Nivo) — bundle size, TypeScript support
- KPI card grid patterns — polling vs SSE vs WebSocket for refresh
- Bug density by feature area — grouping query pattern in EF Core 10
- Report snapshot pattern: pre-aggregate vs on-demand for a small SaaS

**4. Admin Panel (task 05)**
- User directory table: server-side pagination in ASP.NET Core (cursor vs offset)
- Role/Permission matrix UI — checkbox grid for scope assignment
- Session monitoring: displaying Active/Expired/Revoked refresh tokens from UserSessions
- System health endpoint patterns in ASP.NET Core 10

**5. Cross-cutting (applies to 02–05)**
- API response envelope convention: `{ data, meta, errors }` vs bare objects
- Error handling strategy: ProblemDetails (RFC 7807) in ASP.NET Core — current best practice
- Frontend API layer: TanStack Query (React Query) v5 vs SWR for data fetching/caching in 2025–2026
- Form management: React Hook Form v7 vs Formik — current preference
- Toast/notification pattern for CRUD feedback
- Optimistic UI: when to use vs when to wait for server

</include>

<exclude>
- Authentication implementation (already done in task 01)
- Database schema design (already done in task 00)
- Deployment/CI/CD infrastructure
- Real-time collaboration (no requirement in SRS)
- Mobile app considerations
</exclude>

<sources>
Official documentation:
- https://dndkit.com/ — dnd-kit (Kanban drag and drop)
- https://tanstack.com/query/latest — TanStack Query v5
- https://recharts.org/ — Recharts charting
- https://react-hook-form.com/ — React Hook Form
- https://learn.microsoft.com/en-us/aspnet/core/web-api/advanced/conventions — ASP.NET Core conventions
- https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.mvc.problemdetails — ProblemDetails

Search queries:
- "react kanban board dnd-kit 2025 best practices"
- "TanStack Query v5 vs SWR 2025 comparison"
- "recharts vs nivo vs chart.js bundle size 2025"
- "ASP.NET Core 10 ProblemDetails middleware"
- "EF Core 10 group by aggregate query pattern"
- "react admin panel pagination server side 2025"
- "subtask effort tracking UI pattern lightweight"
</sources>
</research_scope>

<verification_checklist>
□ Verify dnd-kit vs react-beautiful-dnd current maintenance status (rbd is deprecated?)
□ Confirm TanStack Query v5 API (useQuery signature changed from v4)
□ Verify Recharts v2 TypeScript support quality
□ Confirm ProblemDetails is default in ASP.NET Core 10 minimal APIs
□ Verify EF Core 10 GroupBy limitations (client-side evaluation warnings)
□ Confirm React Hook Form v7 vs Formik community preference (current year)
□ Check if dnd-kit supports touch/mobile (relevant for Kanban usability)
□ Verify cursor pagination support in EF Core 10 / Npgsql
</verification_checklist>

<research_quality_assurance>
Before completing:

<completeness_check>
- [ ] All 4 workstream areas covered with concrete library/pattern recommendations
- [ ] Each recommendation addresses the actual task spec constraints (e.g., subtask effort formula, session monitoring)
- [ ] Official documentation cited for critical claims
- [ ] Contradictory information resolved or flagged
</completeness_check>

<source_verification>
- [ ] Library version numbers included
- [ ] "deprecated" or "unmaintained" claims verified with GitHub activity
- [ ] Bundle size data sourced from bundlephobia or official benchmarks
- [ ] ASP.NET Core version-specific features confirmed
</source_verification>

<blind_spots_review>
- [ ] Did I consider the project scale? (small team SaaS, ~5–50 users — performance requirements differ)
- [ ] Did I verify React 18 compatibility for all recommended libraries?
- [ ] Did I check Vite-specific considerations for tree-shaking/bundle analysis?
</blind_spots_review>
</research_quality_assurance>

<output_specification>
Write findings to: `.prompts/008-task-mgmt-research/task-mgmt-research.md`

Structure output as:

```xml
<research_output>
  <metadata>
    <topic>task-management-lightweight-app</topic>
    <date>{today}</date>
    <confidence>High|Medium|Low</confidence>
    <scope>workstreams 02–05 of HorusVis React + ASP.NET Core 10</scope>
  </metadata>

  <section id="kanban">
    <title>Kanban Board (Task 03)</title>
    <!-- drag-and-drop, card component, subtask effort table, progress calc -->
  </section>

  <section id="project-management">
    <title>Project Management (Task 02)</title>
    <!-- tabs, member management, feature area tagging -->
  </section>

  <section id="analytics">
    <title>Analytics & Reports (Task 04)</title>
    <!-- charting library, KPI cards, snapshot strategy -->
  </section>

  <section id="admin">
    <title>Admin Panel (Task 05)</title>
    <!-- user directory pagination, role matrix, session monitoring -->
  </section>

  <section id="cross-cutting">
    <title>Cross-Cutting Patterns (02–05)</title>
    <!-- API envelope, ProblemDetails, TanStack Query, React Hook Form, toast -->
  </section>

  <section id="task-review">
    <title>Task Workstream Review</title>
    <!-- Review tasks 02–05 checklist items against findings; flag gaps or conflicts -->
  </section>

  <dependencies>What must be true before implementation can start</dependencies>
  <open_questions>What remains uncertain after research</open_questions>
  <assumptions>What was assumed, not verified</assumptions>
  <confidence>Overall confidence level with rationale</confidence>
</research_output>
```

After writing the full research file, also create `.prompts/008-task-mgmt-research/SUMMARY.md` with:

```markdown
# Task Management Research Summary

**{Substantive one-liner}**

## Version
v1

## Key Findings
- {Finding 1 — most important recommendation}
- {Finding 2}
- ...

## Task Workstream Status
| Task | Status | Gaps / Notes |
|------|--------|--------------|
| 00 DB Migration | ✅ Done | — |
| 01 Login | ✅ Done | — |
| 02 Projects | 🔲 Pending | {any gap found} |
| 03 My Tasks | 🔲 Pending | {any gap found} |
| 04 Reports | 🔲 Pending | {any gap found} |
| 05 Admin | 🔲 Pending | {any gap found} |

## Decisions Needed
{Specific choices requiring user input}

## Blockers
{None, or external impediments}

## Next Step
{Concrete action — e.g., "Create plan prompt for 02-projects"}

---
*Confidence: {High|Medium|Low}*
*Full output: task-mgmt-research.md*
```
</output_specification>
