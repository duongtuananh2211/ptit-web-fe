# Admin Plan — SUMMARY

**One-liner**: Implement the HorusVis Admin page in 6 phases — BE foundation (IsSystem migration + auth fix) → user management API (keyset pagination) → roles/sessions/metrics/health/deployments APIs → FE API layer + shell → user directory with TanStack v5 infinite scroll + RHF v7 forms → role matrix + session monitor + health/deploy panels.

---

## Phase Table

| # | Name | Layer | Key Output |
|---|------|-------|------------|
| 1 | Role.IsSystem + Auth Fix + DAO Extensions | BE | `AddRoleIsSystem` migration; fix `[Authorize(Roles = "admin")]`; extend IUserDao, IRoleDao, IUserSessionDao; add IPermissionDao, ISystemNodeDao, IDeploymentDao |
| 2 | Admin User Management API | BE | `IAdminUsersService` + `AdminUsersController`; keyset `GET /api/admin/users?cursor=`; `POST` create; `PUT` update |
| 3 | Roles / Sessions / Metrics / Health / Deployments APIs | BE | `AdminRolesController`, `AdminSessionsController`, `AdminMetricsController`, IHealthChecks at `/api/admin/health`, `DeploymentsController` |
| 4 | FE API Layer, Auth Client, Admin Shell | FE | `adminApi.ts` (11 typed fns); Bearer auth in `httpClient.ts`; route guard; `AdminSearchBar`; `AdminMetricsBar`; `AdminPage` shell |
| 5 | User Directory + Add/Edit Forms | FE | `UserDirectoryTable` (`useInfiniteQuery` + IntersectionObserver); `AddUserModal` (RHF v7); `EditUserDrawer` (RHF v7) |
| 6 | Role Matrix + Session Monitor + Health/Deploy Panels | FE | `RolePermissionMatrix` (isSystem lock); `SessionMonitoringCard` (revoke + 30s refresh); `SystemLoadCard`; `NodeHealthPanel`; `DeploymentStatusPanel` (empty state) |

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| User directory pagination | Keyset / cursor (`WHERE Id > cursor ORDER BY Id TAKE n+1`) | No row-skip scanning; handles concurrent writes |
| FE infinite scroll | `useInfiniteQuery` (TanStack Query v5), IntersectionObserver sentinel | v5 `getNextPageParam` replaces deprecated `keepPreviousData` |
| Add/Edit forms | React Hook Form v7 | <9KB, zero deps; Formik stalled |
| Role protection | `[Authorize(Roles = "admin")]` on **all** admin controllers | JWT claim is lowercase `RoleCode`; fixes capital-A bug in existing scaffold |
| isSystem guard | `Role.IsSystem` bool column (migration); service throws 400 if true | Prevents deleting/editing "admin" and "user" built-in roles |
| Session status display | Derived at query time: `RevokedAt.HasValue` → Revoked; `ExpiresAt < now` → Expired; else Active | Entity has stored `Status` enum but derived logic is more reliable for display |
| System health | `IHealthChecks` + `AddDbContextCheck<HorusVisDbContext>()` + `AddNpgsql(...)` | Built-in, no extra lib; guarded via `.RequireAuthorization(p => p.RequireRole("admin"))` |
| Deployment panel empty state | Render `<EmptyState>` when `data.length === 0`; no 404 | Table may be empty in demo; graceful UX required |

---

## Decisions Needed

| ID | Question | Impact |
|----|----------|--------|
| Q1 | Dedicated migration `AddRoleIsSystem` or bundle with next pending migration? | Phase 1 sequencing |
| Q2 | Auth context on FE: existing store exposes access token + decoded role? Or must be created in Phase 4? | Phase 4 guard implementation |
| Q3 | Deployments table populated via CI/CD webhook, or manual seed for demo? | Phase 3 / Deployment panel content |
| Q4 | SystemNodes rows: heartbeat agent, or manual seed? | NodeHealthPanel data realism |
| Q5 | Password complexity for admin-created users: min-8 only, or rules? | Phase 2 CreateUserRequest validation |

---

## Blockers

| # | Blocker | Blocks |
|---|---------|--------|
| B1 | `AspNetCore.HealthChecks.Npgsql` NuGet not yet in `Directory.Packages.props` — must verify and add | Phase 3 health endpoint |
| B2 | FE: `@tanstack/react-query`, `react-hook-form`, `sonner` — must confirm presence in `package.json` | Phases 4–6 |
| B3 | FE auth context — if no existing store exposes role + token, Phase 4 must create one before route guard works | Phase 4 |

---

## Next Step

**Execute Phase 1**: add `IsSystem` to `Role` entity, create and apply migration `AddRoleIsSystem`, fix `[Authorize(Roles = "admin")]` in `AdminController.cs`, extend `IUserDao` / `IRoleDao` / `IUserSessionDao` with admin query methods, and register `IPermissionDao`, `ISystemNodeDao`, `IDeploymentDao`.

> Full plan: [admin-plan.md](admin-plan.md)  
> Confidence: **High**
