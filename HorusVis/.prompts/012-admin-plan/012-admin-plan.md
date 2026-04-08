<objective>
Create an implementation plan for Task 05 — Admin page of HorusVis.

Purpose: Break the Admin workstream into ordered, implementable phases so subsequent Do prompts can execute each phase independently.
Input: Research findings from 008-task-mgmt-research, task spec from docs/outlines/tasks/05-admin/README.md
Output: `.prompts/012-admin-plan/admin-plan.md`
</objective>

<context>
Research findings: @.prompts/008-task-mgmt-research/task-mgmt-research.md
Task spec: @docs/outlines/tasks/05-admin/README.md

Key research decisions to incorporate:
- **User directory pagination**: Keyset/cursor pagination via EF Core 10 (WHERE Id > cursor ORDER BY Id TAKE n+1)
- **Role/permission matrix**: Checkbox grid UI; roles stored with scope JSON/string in DB
- **Session monitoring**: Read directly from `UserSessions` table (already exists from task 00/01)
  - Status derived: `RevokedAt.HasValue ? "Revoked" : ExpiresAt < now ? "Expired" : "Active"`
- **System health**: ASP.NET Core `IHealthChecks` with `AddDbContextCheck<HorusVisDbContext>()` + Npgsql
- **Authorization**: All admin endpoints require admin role — add `[Authorize(Roles = "admin")]` or policy
- **TanStack Query v5**: cursor-based infinite query for user directory (`useInfiniteQuery`)
- **React Hook Form v7**: AddUserModal, EditUserDrawer forms

Stack: React 18 + TypeScript + Vite | ASP.NET Core 10 Web API | EF Core 10 | PostgreSQL (schema "horusvis")
Auth: Bearer token — superadmin seeded in DB (from migration task)
DAO + UoW pattern already established: new services use DAOs, controllers call SaveChangesAsync
Existing: UserSessions, Users, Roles tables fully set up
</context>

<planning_requirements>
The plan must cover:

**Backend phases first**:
1. Admin authorization policy: add "admin" role policy via `services.AddAuthorization`
2. AdminUsersService + AdminUsersController:
   - GET /api/admin/users?pageSize=20&cursor={id}  (keyset pagination)
   - POST /api/admin/users (create user with role)
   - PUT /api/admin/users/{userId} (update status, role, profile)
3. AdminRolesService + AdminRolesController:
   - GET /api/admin/roles
   - PUT /api/admin/roles/{roleId}  (update scope/permissions)
4. AdminSessionsService + AdminSessionsController:
   - GET /api/admin/sessions  (with status derivation: Active/Expired/Revoked)
   - DELETE /api/admin/sessions/{sessionId}  (force revoke)
5. AdminMetricsController:
   - GET /api/admin/metrics  (total users, active sessions count, system load summary)
6. System health endpoint:
   - GET /api/admin/health  (IHealthChecks — DB check + Npgsql)
7. DeploymentsController (optional/stub):
   - GET /api/deployments  (recent entries from Deployments table — may be empty)

**Frontend phases after BE**:
8. API service layer: adminApi.ts + TypeScript types
9. AdminPage shell + AdminSearchBar + AdminMetricsBar (Total Users, Active Sessions, System Load)
10. UserDirectoryTable: infinite scroll with cursor pagination (`useInfiniteQuery`)
11. AddUserModal + EditUserDrawer (React Hook Form v7)
12. RolePermissionMatrix: checkbox grid for scope assignment
13. SessionMonitoringCard: table of sessions with status badges (Active/Expired/Revoked) + revoke button
14. SystemLoadCard + NodeHealthPanel (health endpoint data)
15. DeploymentStatusPanel (optional — show empty state if no data)
16. AdminSearchBar: filters UserDirectoryTable (name/email search, client-side or server-side)

Constraints:
- Deployment monitoring panel: render empty state gracefully if Deployments table is empty
- Role editing: built-in "admin" and "user" roles are system roles — prevent delete (isSystem guard)
- Non-admin users: redirect away from /admin with 403
- Pagination: keyset (cursor), NOT offset

Success criteria:
- Admin can list, create, edit users in UserDirectoryTable
- Role permission matrix can be updated and saved
- Active sessions are visible with revoke capability
- System health shows DB connectivity
- All endpoints return 403 for non-admin users
- Build passes, no TypeScript errors
</planning_requirements>

<output_structure>
Save to: `.prompts/012-admin-plan/admin-plan.md`

Use XML plan structure:
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

Aim for 5–6 phases. Each phase completable in a single Do prompt.
</output_structure>

<summary_requirements>
Create `.prompts/012-admin-plan/SUMMARY.md` with one-liner, phase table, decisions needed, blockers, next step.

---
*Confidence: High|Medium|Low*
*Full output: admin-plan.md*
</summary_requirements>
