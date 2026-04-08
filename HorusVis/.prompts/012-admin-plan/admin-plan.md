<?xml version="1.0" encoding="utf-8"?>
<plan>
  <summary>
    Implement the HorusVis Admin workstream (Task 05) in 6 ordered phases:
    backend foundation → user API → roles/sessions/metrics/health APIs →
    frontend API layer + shell → user directory + forms → role matrix + monitoring panels.
    Relies on existing Users, Roles, RolePermissions, UserSessions, SystemNodes, and Deployments
    tables. Session status is derived at query time from RevokedAt / RefreshTokenExpiresAt.
    All admin endpoints carry [Authorize(Roles = "admin")]. User directory uses keyset
    (cursor) pagination. FE uses TanStack Query v5 useInfiniteQuery + React Hook Form v7.
  </summary>

  <phases>

    <!-- ═══════════════════════════════════════════════════════════ PHASE 1 ═══ -->
    <phase number="1" name="Backend Foundation — Role.IsSystem, Auth Fix, DAO Extensions">
      <objective>
        Lay the authorization groundwork required by all subsequent admin phases.
        Fix the case-mismatch bug in AdminController, add the IsSystem guard column to
        the Roles table, extend IUserDao / IRoleDao / IUserSessionDao with admin-specific
        query methods, and register them so Phase 2–3 services can depend on them without
        further scaffold work.
      </objective>

      <tasks>
        <task priority="high">
          Fix role-claim case mismatch in
          backend/src/HorusVis.Web/Controllers/AdminController.cs:
          Change [Authorize(Roles = "Admin")] → [Authorize(Roles = "admin")].
          The seeded RoleCode is lowercase "admin" (see SeedAdminUser migration).
        </task>

        <task priority="high">
          Add IsSystem bool property to Role entity
          (backend/src/HorusVis.Data/Horusvis/Entities/Role.cs):
            public bool IsSystem { get; set; } = false;
          Column: nullable bit defaulting false in existing rows.
        </task>

        <task priority="high">
          Create EF Core migration "AddRoleIsSystem"
          (project: HorusVis.Data.Migrations):
          - AddColumn Roles.IsSystem bool default false
          - UPDATE horusvis."Roles" SET "IsSystem" = true
            WHERE "RoleCode" IN ('admin', 'user')
        </task>

        <task priority="high">
          Extend IUserDao (backend/src/HorusVis.Data/Dao/IUserDao.cs) with:
            Task&lt;(List&lt;User&gt; Items, bool HasMore)&gt; ListPageAsync(
                Guid? cursor, int pageSize, CancellationToken ct);
            Task&lt;int&gt; CountActiveAsync(CancellationToken ct);
          Implement in UserDao.cs using keyset:
            WHERE u.Id > cursor ORDER BY u.Id TAKE pageSize+1
        </task>

        <task priority="high">
          Extend IRoleDao (backend/src/HorusVis.Data/Dao/IRoleDao.cs) with:
            Task&lt;List&lt;Role&gt;&gt; ListAllWithPermissionsAsync(CancellationToken ct);
            Task&lt;Role?&gt; FindByIdAsync(Guid id, CancellationToken ct);
          Implement in RoleDao.cs (Include RolePermissions → Permission navigation).
        </task>

        <task priority="high">
          Extend IUserSessionDao with:
            Task&lt;List&lt;UserSession&gt;&gt; ListRecentAsync(int take, CancellationToken ct);
            Task&lt;UserSession?&gt; FindByIdAsync(Guid id, CancellationToken ct);
            Task RevokeAsync(Guid sessionId, DateTimeOffset revokedAt, CancellationToken ct);
            Task&lt;int&gt; CountActiveAsync(CancellationToken ct);
          Implement in UserSessionDao.cs.
        </task>

        <task priority="medium">
          Add new DAO interfaces + concrete classes for tables not yet covered:
          - IPermissionDao / PermissionDao:
              Task&lt;List&lt;Permission&gt;&gt; ListAllAsync(CancellationToken ct);
          - ISystemNodeDao / SystemNodeDao:
              Task&lt;List&lt;SystemNode&gt;&gt; ListAllAsync(CancellationToken ct);
          - IDeploymentDao / DeploymentDao:
              Task&lt;List&lt;Deployment&gt;&gt; ListRecentAsync(int take, CancellationToken ct);
          Register all in HorusVis.Data/ServiceCollectionExtensions.cs.
        </task>

        <task priority="medium">
          Create shared DTO folder backend/src/HorusVis.Web/Contracts/Admin/ with
          placeholder files: UserAdminDto.cs, RoleAdminDto.cs, SessionAdminDto.cs,
          MetricsDto.cs, DeploymentAdminDto.cs, NodeAdminDto.cs.
          (Stubs only — populated in Phase 2–3.)
        </task>
      </tasks>

      <deliverables>
        <deliverable>Role.IsSystem column + migration "AddRoleIsSystem" applied</deliverable>
        <deliverable>AdminController.cs: [Authorize(Roles = "admin")] (lowercase)</deliverable>
        <deliverable>IUserDao extended with ListPageAsync + CountActiveAsync</deliverable>
        <deliverable>IRoleDao extended with ListAllWithPermissionsAsync + FindByIdAsync</deliverable>
        <deliverable>IUserSessionDao extended with ListRecentAsync, FindByIdAsync, RevokeAsync, CountActiveAsync</deliverable>
        <deliverable>IPermissionDao, ISystemNodeDao, IDeploymentDao + implementations registered in DI</deliverable>
        <deliverable>HorusVis.Web/Contracts/Admin/ stub DTO files created</deliverable>
        <deliverable>dotnet build passes (0 errors)</deliverable>
      </deliverables>

      <dependencies>None — DB migrations from Task 00/01 already applied</dependencies>
    </phase>

    <!-- ═══════════════════════════════════════════════════════════ PHASE 2 ═══ -->
    <phase number="2" name="Backend — Admin User Management API">
      <objective>
        Implement the full CRUD surface for admin-managed users via keyset-paginated list,
        create, and update endpoints. A dedicated IAdminUsersService handles all logic;
        AdminUsersController exposes it under /api/admin/users with the admin role guard.
      </objective>

      <tasks>
        <task priority="high">
          Create backend/src/HorusVis.Business/Contracts/IAdminUsersService.cs:
            Task&lt;PagedUsersResponse&gt; ListUsersAsync(
                Guid? cursor, int pageSize, CancellationToken ct);
            Task&lt;UserAdminDto&gt; CreateUserAsync(CreateUserRequest req, CancellationToken ct);
            Task&lt;UserAdminDto&gt; UpdateUserAsync(
                Guid userId, UpdateUserRequest req, CancellationToken ct);
        </task>

        <task priority="high">
          Create backend/src/HorusVis.Business/Services/AdminUsersService.cs
          implementing IAdminUsersService.

          ListUsersAsync:
            Uses IUserDao.ListPageAsync(cursor, pageSize) — keyset WHERE Id > cursor ORDER BY Id.
            Returns PagedUsersResponse { List&lt;UserAdminDto&gt; Data, string? NextCursor, bool HasMore }.
            NextCursor = last item Id if HasMore, else null.

          CreateUserAsync:
            Validate email/username uniqueness via IUserDao.
            Hash password via IPasswordService.
            Resolve role by roleCode via IRoleDao.FindByRoleCodeAsync.
            Add user via IUserDao.Add(). No SaveChanges — controller commits.

          UpdateUserAsync:
            Load user via IUserDao.FindByIdAsync — throw 404 if missing.
            Update: FullName, Email, Status (UserStatus enum), RoleId (resolve via IRoleDao).
            No SaveChanges — controller commits.
        </task>

        <task priority="high">
          Define DTOs in HorusVis.Web/Contracts/Admin/UserAdminDto.cs:
            record UserAdminDto(
                Guid Id, string Username, string Email, string FullName,
                string RoleCode, string RoleName, string Status,
                DateTimeOffset? LastLoginAt, DateTimeOffset CreatedAt);

          PagedUsersResponse.cs:
            record PagedUsersResponse(
                List&lt;UserAdminDto&gt; Data, string? NextCursor, bool HasMore);

          CreateUserRequest.cs:
            record CreateUserRequest(
                [Required][MaxLength(50)] string Username,
                [Required][EmailAddress] string Email,
                [Required] string FullName,
                [Required][MinLength(8)] string Password,
                [Required] string RoleCode);

          UpdateUserRequest.cs:
            record UpdateUserRequest(
                string? FullName, string? Email,
                string? Status, string? RoleCode);
        </task>

        <task priority="high">
          Create backend/src/HorusVis.Web/Controllers/AdminUsersController.cs:
            [ApiController]
            [Authorize(Roles = "admin")]
            [Route("api/admin/users")]
            public sealed class AdminUsersController(
                IAdminUsersService adminUsersService,
                IUnitOfWorkService uow) : ControllerBase

            GET  /api/admin/users?pageSize=20&amp;cursor={guid}
              → await adminUsersService.ListUsersAsync(cursor, pageSize, ct)
              → return Ok(result)

            POST /api/admin/users  Body: CreateUserRequest
              → [FromBody] with model validation
              → await adminUsersService.CreateUserAsync(req, ct)
              → await uow.SaveChangesAsync(ct)
              → return CreatedAtAction(nameof(GetUser)...) or Created(...)

            PUT  /api/admin/users/{userId}  Body: UpdateUserRequest
              → await adminUsersService.UpdateUserAsync(userId, req, ct)
              → await uow.SaveChangesAsync(ct)
              → return Ok(result)
        </task>

        <task priority="medium">
          Register IAdminUsersService → AdminUsersService in
          HorusVis.Business/ServiceCollectionExtensions.cs as Scoped.
        </task>
      </tasks>

      <deliverables>
        <deliverable>IAdminUsersService + AdminUsersService with keyset pagination, create, update</deliverable>
        <deliverable>AdminUsersController at /api/admin/users [Authorize(Roles = "admin")]</deliverable>
        <deliverable>DTOs: UserAdminDto, PagedUsersResponse, CreateUserRequest, UpdateUserRequest</deliverable>
        <deliverable>GET /api/admin/users?pageSize=20 returns { data, nextCursor, hasMore }</deliverable>
        <deliverable>POST /api/admin/users creates user and returns 201 UserAdminDto</deliverable>
        <deliverable>PUT /api/admin/users/{userId} returns 200 UserAdminDto</deliverable>
        <deliverable>Non-admin request → 403 Forbidden</deliverable>
        <deliverable>dotnet build passes</deliverable>
      </deliverables>

      <dependencies>Phase 1 complete (IsSystem column, DAO extensions, DI registrations)</dependencies>
    </phase>

    <!-- ═══════════════════════════════════════════════════════════ PHASE 3 ═══ -->
    <phase number="3" name="Backend — Roles, Sessions, Metrics, Health &amp; Deployments APIs">
      <objective>
        Implement the remaining five BE endpoint groups in a single phase to complete the
        backend surface before FE work begins. Each group has its own controller; shared
        logic is isolated in corresponding services.
      </objective>

      <tasks>
        <!-- ROLES -->
        <task priority="high">
          Create IAdminRolesService + AdminRolesService:

          ListRolesAsync(ct):
            IRoleDao.ListAllWithPermissionsAsync() → map to RoleAdminDto[].
            RoleAdminDto includes IsSystem flag and list of PermissionScopeDto.

          UpdateRolePermissionsAsync(Guid roleId, List&lt;string&gt; permissionScopes, ct):
            Load role via IRoleDao.FindByIdAsync — 404 if missing.
            Guard: if role.IsSystem == true → throw InvalidOperationException
              ("System roles cannot be modified.")
            Load Permission entities for requested scopes (IPermissionDao.ListAllAsync filtered).
            Remove all existing RolePermissions for this role from DbContext.
            Add new RolePermission rows (Id = Guid.NewGuid(), GrantedAt = now).
            No SaveChanges — controller commits.

          DTOs in HorusVis.Web/Contracts/Admin/RoleAdminDto.cs:
            record PermissionScopeDto(Guid Id, string Scope, string? Description);
            record RoleAdminDto(
                Guid Id, string RoleCode, string RoleName,
                bool IsSystem, List&lt;PermissionScopeDto&gt; Permissions);
          UpdateRoleRequest.cs:
            record UpdateRoleRequest([Required] List&lt;string&gt; PermissionScopes);
        </task>

        <task priority="high">
          Create AdminRolesController at /api/admin/roles [Authorize(Roles = "admin")]:
            GET  /api/admin/roles → Ok(roles)
            PUT  /api/admin/roles/{roleId} → UpdateRolePermissionsAsync → uow.SaveChanges → Ok()
        </task>

        <!-- SESSIONS -->
        <task priority="high">
          Create IAdminSessionsService + AdminSessionsService:

          ListSessionsAsync(ct):
            IUserSessionDao.ListRecentAsync(50) — ordered by LastUsedAt desc.
            Map to SessionAdminDto; compute DisplayStatus:
              RevokedAt.HasValue → "Revoked"
              RefreshTokenExpiresAt &lt; UtcNow → "Expired"
              else → "Active"

          RevokeSessionAsync(Guid sessionId, ct):
            IUserSessionDao.RevokeAsync(sessionId, DateTimeOffset.UtcNow, ct).
            If session not found → throw KeyNotFoundException.
            No SaveChanges — controller commits.

          DTOs in HorusVis.Web/Contracts/Admin/SessionAdminDto.cs:
            record SessionAdminDto(
                Guid Id, Guid UserId, string UserEmail,
                DateTimeOffset CreatedAt, DateTimeOffset? LastUsedAt,
                DateTimeOffset RefreshTokenExpiresAt, DateTimeOffset? RevokedAt,
                string DisplayStatus);
        </task>

        <task priority="high">
          Create AdminSessionsController at /api/admin/sessions [Authorize(Roles = "admin")]:
            GET    /api/admin/sessions → Ok(sessions)
            DELETE /api/admin/sessions/{sessionId} → RevokeSessionAsync → uow.SaveChanges → NoContent()
        </task>

        <!-- METRICS -->
        <task priority="high">
          Create AdminMetricsController at /api/admin/metrics [Authorize(Roles = "admin")]:
          No separate service — inline queries via injected DAO instances:
            GET /api/admin/metrics:
              totalUsers     = await userDao.CountActiveAsync(ct)
              activeSessions = await userSessionDao.CountActiveAsync(ct)
              nodes          = await systemNodeDao.ListAllAsync(ct)
              avgCpuLoad     = nodes.Average(n => n.CpuLoadPercent ?? 0)
              avgMemLoad     = nodes.Average(n => n.MemoryLoadPercent ?? 0)
              → return Ok(new MetricsDto(totalUsers, activeSessions, avgCpuLoad, avgMemLoad))

          DTOs in HorusVis.Web/Contracts/Admin/MetricsDto.cs:
            record MetricsDto(
                int TotalUsers, int ActiveSessions,
                decimal AvgCpuLoadPercent, decimal AvgMemoryLoadPercent);

          GET /api/admin/nodes → list of NodeAdminDto (for NodeHealthPanel):
            record NodeAdminDto(
                Guid Id, string NodeName, string Environment,
                decimal? CpuLoadPercent, decimal? MemoryLoadPercent,
                string Status, DateTimeOffset? LastHeartbeatAt);
        </task>

        <!-- HEALTH -->
        <task priority="high">
          Add IHealthChecks configuration to Program.cs:
            builder.Services.AddHealthChecks()
                .AddDbContextCheck&lt;HorusVisDbContext&gt;("database")
                .AddNpgsql(connectionString, name: "postgres");

          Map endpoints (after app.UseAuthorization()):
            app.MapHealthChecks("/api/admin/health", new HealthCheckOptions
            {
                ResultStatusCodes = {
                    [HealthStatus.Healthy]   = 200,
                    [HealthStatus.Degraded]  = 200,
                    [HealthStatus.Unhealthy] = 503
                },
                ResponseWriter = WriteJsonHealthResponse  // inline minimal writer
            }).RequireAuthorization(p => p.RequireRole("admin"));

          Write a minimal inline ResponseWriter that returns:
            { "status": "Healthy"|"Degraded"|"Unhealthy",
              "checks": [ { "name": "...", "status": "..." } ] }

          NuGet: AspNetCore.HealthChecks.NpgsqlDataSource or Npgsql.EntityFrameworkCore —
          check Directory.Packages.props; add if missing.

          NOTE: No SystemHealthController class — MapHealthChecks handles this.
        </task>

        <!-- DEPLOYMENTS -->
        <task priority="medium">
          Create IDeploymentService + DeploymentService:
            Task&lt;List&lt;DeploymentAdminDto&gt;&gt; ListRecentAsync(int take, ct):
              IDeploymentDao.ListRecentAsync(take) ordered by StartedAt desc.
              Return empty list if no rows — no 404.

          DTOs in HorusVis.Web/Contracts/Admin/DeploymentAdminDto.cs:
            record DeploymentAdminDto(
                Guid Id, string Environment, string VersionLabel,
                DateTimeOffset StartedAt, DateTimeOffset? FinishedAt,
                string Status, string? TriggeredByUserEmail);

          Create DeploymentsController at /api/deployments [Authorize(Roles = "admin")]:
            GET /api/deployments?take=10 → Ok(list)  (empty list when table is empty)
        </task>

        <task priority="medium">
          Register IAdminRolesService, IAdminSessionsService, IDeploymentService in
          HorusVis.Business/ServiceCollectionExtensions.cs as Scoped.
        </task>
      </tasks>

      <deliverables>
        <deliverable>AdminRolesController: GET /api/admin/roles, PUT /api/admin/roles/{roleId}</deliverable>
        <deliverable>isSystem guard: PUT /api/admin/roles/{id} returns 400 for system roles</deliverable>
        <deliverable>AdminSessionsController: GET /api/admin/sessions, DELETE /api/admin/sessions/{id}</deliverable>
        <deliverable>AdminMetricsController: GET /api/admin/metrics, GET /api/admin/nodes</deliverable>
        <deliverable>IHealthChecks wired at GET /api/admin/health (admin-guarded)</deliverable>
        <deliverable>DeploymentsController: GET /api/deployments (empty list when table empty)</deliverable>
        <deliverable>dotnet build passes; Swagger shows all new endpoints</deliverable>
      </deliverables>

      <dependencies>Phase 1 complete; Phase 2 optional (parallel-able but Phase 1 mandatory)</dependencies>
    </phase>

    <!-- ═══════════════════════════════════════════════════════════ PHASE 4 ═══ -->
    <phase number="4" name="Frontend — API Layer, Auth Client, Admin Page Shell">
      <objective>
        Build the typed TypeScript API layer for all admin endpoints, wire auth Bearer token
        into the HTTP client, implement the AdminPage shell with AdminSearchBar and
        AdminMetricsBar, and add a route guard that blocks non-admin users from /admin.
      </objective>

      <tasks>
        <task priority="high">
          Extend frontend/horusvis-react/src/api/httpClient.ts to support
          an Authorization header:
            export async function apiGetAuth&lt;T&gt;(
                path: string, token: string, init?: RequestInit): Promise&lt;T&gt;
            export async function apiPostAuth&lt;T&gt;(
                path: string, body: unknown, token: string): Promise&lt;T&gt;
            export async function apiPutAuth&lt;T&gt;(
                path: string, body: unknown, token: string): Promise&lt;T&gt;
            export async function apiDeleteAuth(
                path: string, token: string): Promise&lt;void&gt;
          Authorization: `Bearer ${token}` header; reads token from
          useAuthContext() / localStorage("access_token").
        </task>

        <task priority="high">
          Create frontend/horusvis-react/src/api/adminApi.ts with:

          TypeScript types:
            UserAdminDto, PagedUsersResponse, CreateUserRequest, UpdateUserRequest,
            RoleAdminDto, PermissionScopeDto,
            SessionAdminDto, MetricsDto, NodeAdminDto,
            DeploymentAdminDto, HealthResponse

          Functions (all accept token: string):
            fetchAdminUsers(cursor?: string, pageSize?: number, token: string)
              → GET /api/admin/users?cursor=&amp;pageSize=
            createAdminUser(req: CreateUserRequest, token: string)
              → POST /api/admin/users
            updateAdminUser(userId: string, req: UpdateUserRequest, token: string)
              → PUT /api/admin/users/{userId}
            fetchAdminRoles(token: string)
              → GET /api/admin/roles
            updateRolePermissions(roleId: string, scopes: string[], token: string)
              → PUT /api/admin/roles/{roleId}
            fetchAdminSessions(token: string)
              → GET /api/admin/sessions
            revokeSession(sessionId: string, token: string)
              → DELETE /api/admin/sessions/{sessionId}
            fetchAdminMetrics(token: string)
              → GET /api/admin/metrics
            fetchAdminNodes(token: string)
              → GET /api/admin/nodes
            fetchAdminHealth(token: string)
              → GET /api/admin/health
            fetchDeployments(take: number, token: string)
              → GET /api/deployments?take={take}
        </task>

        <task priority="high">
          Implement route guard in
          frontend/horusvis-react/src/app/router.tsx (or a dedicated
          RequireAdminRole component):
          - Read role from auth context (decoded JWT or stored user object).
          - If role !== "admin" → &lt;Navigate to="/" replace /&gt;.
          - Wrap /admin route with this guard.
        </task>

        <task priority="high">
          Create frontend/horusvis-react/src/components/admin/AdminSearchBar.tsx:
            Props: value: string, onChange: (v: string) =&gt; void
            Controlled input with 300ms debounce internally.
            Triggers parent filter state; used in AdminPage for name/email filtering.
        </task>

        <task priority="high">
          Create frontend/horusvis-react/src/components/admin/AdminMetricsBar.tsx:
            Uses useQuery({ queryKey: ['admin', 'metrics'], queryFn }) from TanStack Query v5.
            Renders 3 metric cards: Total Users, Active Sessions, Avg CPU Load.
            While loading: skeleton placeholders. On error: "--" values.
        </task>

        <task priority="high">
          Replace AdminPage scaffold in
          frontend/horusvis-react/src/pages/AdminPage.tsx:
            Layout: AdminSearchBar (top) + AdminMetricsBar + tab-or-section layout
            holding placeholders for UserDirectoryTable, RolePermissionMatrix,
            SessionMonitoringCard, SystemLoadCard, DeploymentStatusPanel.
            Sections rendered empty until Phase 5–6 components replace them.
        </task>
      </tasks>

      <deliverables>
        <deliverable>httpClient.ts: apiGetAuth, apiPostAuth, apiPutAuth, apiDeleteAuth with Bearer header</deliverable>
        <deliverable>adminApi.ts: typed functions for all 11 admin API calls</deliverable>
        <deliverable>Route guard on /admin: role !== "admin" redirects to /</deliverable>
        <deliverable>AdminSearchBar component (debounced)</deliverable>
        <deliverable>AdminMetricsBar with real metrics query (3 cards)</deliverable>
        <deliverable>AdminPage shell with section placeholders; no TypeScript errors</deliverable>
      </deliverables>

      <dependencies>Phases 1–3 complete (API endpoints must exist for wiring to work)</dependencies>
    </phase>

    <!-- ═══════════════════════════════════════════════════════════ PHASE 5 ═══ -->
    <phase number="5" name="Frontend — User Directory Table + Add/Edit Forms">
      <objective>
        Build the paginated user directory with cursor-based infinite scroll and the
        Add/Edit modals backed by React Hook Form v7. This is the primary admin UX surface.
      </objective>

      <tasks>
        <task priority="high">
          Create frontend/horusvis-react/src/components/admin/UserDirectoryTable.tsx:

          Data: useInfiniteQuery (TanStack Query v5):
            queryKey: ['admin', 'users', searchTerm]
            queryFn: ({ pageParam }) =&gt;
              fetchAdminUsers(pageParam, 20, token)
            initialPageParam: undefined
            getNextPageParam: (lastPage) =&gt;
              lastPage.hasMore ? lastPage.nextCursor : undefined

          Infinite scroll trigger:
            Place &lt;div ref={sentinelRef} /&gt; at bottom of table.
            IntersectionObserver: when sentinel visible &amp;&amp; hasNextPage → fetchNextPage().

          Columns: Username | Full Name | Email | Role | Status | Last Login | Actions
          Props: searchTerm: string (from AdminSearchBar), onEditUser: (user) =&gt; void

          Client-side search filter: filter flattened pages by username/email containing searchTerm.
          (Server-side search can be added post-MVP by passing q= param.)
        </task>

        <task priority="high">
          Create frontend/horusvis-react/src/components/admin/UserDirectoryRow.tsx:
            Presentational row component.
            Props: user: UserAdminDto, onEdit: () =&gt; void
            Status badge: Active=green, Inactive=grey, Suspended=red.
        </task>

        <task priority="high">
          Create frontend/horusvis-react/src/components/admin/AddUserModal.tsx:
            Opens as modal dialog (Radix UI Dialog or plain CSS modal).
            React Hook Form v7:
              const { register, handleSubmit, reset, formState } = useForm&lt;CreateUserRequest&gt;({
                defaultValues: { username: '', email: '', fullName: '', password: '', roleCode: 'user' }
              });
            Fields: Username, Email, Full Name, Password, Role (select from fetched roles).
            On submit: useMutation → createAdminUser → onSuccess: reset(); queryClient.invalidateQueries(['admin','users']); close modal.
        </task>

        <task priority="high">
          Create frontend/horusvis-react/src/components/admin/EditUserDrawer.tsx:
            Opens as slide-in drawer.
            React Hook Form v7:
              useForm&lt;UpdateUserRequest&gt; with defaultValues pre-filled from selected UserAdminDto.
            Fields: Full Name, Email, Status (select: Active/Inactive/Suspended), Role (select).
            On submit: useMutation → updateAdminUser(userId, ...) →
              onSuccess: queryClient.invalidateQueries(['admin','users']); close drawer.
        </task>

        <task priority="medium">
          Wire AddUserModal and EditUserDrawer into AdminPage:
            AdminPage state:
              const [addOpen, setAddOpen] = useState(false);
              const [editUser, setEditUser] = useState&lt;UserAdminDto | null&gt;(null);
            "Add User" button → setAddOpen(true).
            UserDirectoryTable onEditUser → setEditUser(user).
        </task>
      </tasks>

      <deliverables>
        <deliverable>UserDirectoryTable: useInfiniteQuery cursor pagination + IntersectionObserver infinite scroll</deliverable>
        <deliverable>UserDirectoryRow: status badge colors (Active/Inactive/Suspended)</deliverable>
        <deliverable>AddUserModal: React Hook Form v7, POST /api/admin/users, cache invalidation</deliverable>
        <deliverable>EditUserDrawer: React Hook Form v7, PUT /api/admin/users/{id}, cache invalidation</deliverable>
        <deliverable>AdminPage wired with open/edit state; no TypeScript errors</deliverable>
      </deliverables>

      <dependencies>Phase 4 complete (adminApi.ts, auth client)</dependencies>
    </phase>

    <!-- ═══════════════════════════════════════════════════════════ PHASE 6 ═══ -->
    <phase number="6" name="Frontend — Role Matrix, Session Monitor, Health &amp; Deployment Panels">
      <objective>
        Build the remaining four admin panels: the checkbox-grid role permission matrix,
        the session monitoring table with revoke action, the system load / node health
        panel, and the deployment history panel with empty-state handling.
      </objective>

      <tasks>
        <task priority="high">
          Create frontend/horusvis-react/src/components/admin/RolePermissionMatrix.tsx:

          Data: useQuery(['admin','roles'], () =&gt; fetchAdminRoles(token))
          Data: useQuery(['admin','permissions'], ...) — derive full permission list from roles union.

          Renders a grid:
            Rows = Permissions (Scope strings), Columns = Roles.
            Each cell = &lt;input type="checkbox" /&gt; checked if role.permissions includes scope.

          isSystem guard:
            For roles where isSystem === true, render column header with lock icon
            and disable all checkboxes in that column.
            Tooltip: "System roles cannot be modified."

          Save button per role column:
            useMutation → updateRolePermissions(roleId, selectedScopes, token)
            → onSuccess: toast.success('Permissions saved'); invalidate roles query.
        </task>

        <task priority="high">
          Create frontend/horusvis-react/src/components/admin/SessionMonitoringCard.tsx:

          Data: useQuery(['admin','sessions'], () =&gt; fetchAdminSessions(token),
                { refetchInterval: 30_000 })

          Table columns: User Email | Created | Last Used | Expires | Status | Action
          Status badge:
            "Active" → green
            "Expired" → yellow/orange
            "Revoked" → red/grey

          Revoke button (only shown when DisplayStatus === "Active"):
            useMutation → revokeSession(sessionId, token)
            → onSuccess: invalidate ['admin','sessions']; toast.success('Session revoked').
            Disabled + loading spinner while mutation pending.
        </task>

        <task priority="high">
          Create frontend/horusvis-react/src/components/admin/SystemLoadCard.tsx:
            Data: useQuery(['admin','metrics'], ...) already fetched in AdminMetricsBar.
            Share query via queryClient.getQueryData or pass props.
            Renders AvgCpuLoadPercent + AvgMemoryLoadPercent as progress bars.

          Create frontend/horusvis-react/src/components/admin/NodeHealthPanel.tsx:
            Data: useQuery(['admin','nodes'], () =&gt; fetchAdminNodes(token))
            Table columns: Node Name | Environment | CPU% | Memory% | Status | Last Heartbeat
            NodeStatus enum → badge colors (Online=green, Degraded=yellow, Offline=red).
        </task>

        <task priority="medium">
          Create frontend/horusvis-react/src/components/admin/DeploymentStatusPanel.tsx:
            Data: useQuery(['admin','deployments'], () =&gt; fetchDeployments(10, token))
            If data.length === 0: render &lt;EmptyState message="No deployments recorded yet." /&gt;.
            Otherwise: table — Environment | Version | Started | Finished | Status | Triggered By.
            DeploymentStatus badges: Success=green, Failed=red, InProgress=blue, Pending=grey.
        </task>

        <task priority="low">
          Wire all panels into AdminPage in section layout:
            &lt;AdminMetricsBar /&gt;
            &lt;section&gt; &lt;AdminSearchBar /&gt; + "Add User" button &lt;/section&gt;
            &lt;UserDirectoryTable searchTerm={...} onEditUser={...} /&gt;
            &lt;RolePermissionMatrix /&gt;
            &lt;SessionMonitoringCard /&gt;
            &lt;div className="grid grid-cols-2"&gt;
              &lt;SystemLoadCard /&gt;
              &lt;NodeHealthPanel /&gt;
            &lt;/div&gt;
            &lt;DeploymentStatusPanel /&gt;
        </task>
      </tasks>

      <deliverables>
        <deliverable>RolePermissionMatrix: checkbox grid, isSystem lock, save per-role via PUT /api/admin/roles/{id}</deliverable>
        <deliverable>SessionMonitoringCard: status badges, revoke button, 30s auto-refresh</deliverable>
        <deliverable>SystemLoadCard: avg CPU/memory progress bars</deliverable>
        <deliverable>NodeHealthPanel: per-node status table</deliverable>
        <deliverable>DeploymentStatusPanel: renders empty state when Deployments table is empty</deliverable>
        <deliverable>AdminPage fully assembled; all panels visible; npm run build passes with 0 TS errors</deliverable>
      </deliverables>

      <dependencies>Phases 4–5 complete</dependencies>
    </phase>

  </phases>

  <metadata>
    <confidence level="high">
      All entity shapes confirmed from source (Role, User, UserSession, Permission,
      RolePermission, SystemNode, Deployment). DAO contracts verified. Auth + UoW
      pattern well-established from Task 01. Keyset pagination and IHealthChecks
      approach confirmed from research.
    </confidence>

    <dependencies>
      <dependency>AspNetCore.HealthChecks.Npgsql NuGet package (check Directory.Packages.props; add if absent)</dependency>
      <dependency>TanStack Query v5 (@tanstack/react-query) — confirm already in package.json</dependency>
      <dependency>React Hook Form v7 (react-hook-form) — confirm in package.json</dependency>
      <dependency>sonner (toast) — confirm in package.json</dependency>
      <dependency>Radix UI Dialog/Drawer — or equivalent already used in project</dependency>
    </dependencies>

    <open_questions>
      <question id="Q1">
        Role.IsSystem addition requires a migration. Does the team want a dedicated
        migration "AddRoleIsSystem" or should it be bundled with another pending migration?
      </question>
      <question id="Q2">
        AdminMetricsController inlines DAO calls directly. If this grows, should it
        be extracted to an IAdminMetricsService? (Low priority for MVP.)
      </question>
      <question id="Q3">
        Deployments table is currently empty — is there a plan to seed or populate it
        via a CI/CD webhook, or will it remain a manual-entry table?
      </question>
      <question id="Q4">
        SystemNodes table data source: is it populated by an external heartbeat agent,
        or will rows need to be seeded manually for demo purposes?
      </question>
      <question id="Q5">
        Frontend auth context: is there already an auth context/store that exposes
        the JWT access token and decoded role? (Needed by Phase 4 route guard and
        apiGetAuth calls.) If not, Phase 4 must create one.
      </question>
      <question id="Q6">
        Password policy for admin-created users (CreateUserRequest.Password):
        minimum length only (8 chars), or complexity rules too?
      </question>
    </open_questions>

    <assumptions>
      <assumption>JWT role claim value is "admin" (lowercase) — matches seeded RoleCode; AdminController bug (capital A) is fixed in Phase 1.</assumption>
      <assumption>UserSession.Status enum is kept in sync by the auth/refresh flow; Phase 3 derives display status from RevokedAt + RefreshTokenExpiresAt for accuracy.</assumption>
      <assumption>Permission.Scope strings follow a "resource:action" convention (e.g., "projects:read") — matrix rows are driven by these strings.</assumption>
      <assumption>No offset pagination anywhere — only keyset (cursor) for user directory (TanStack useInfiniteQuery).</assumption>
      <assumption>IUnitOfWorkService.SaveChangesAsync is called by controllers, not services (established pattern from Task 01).</assumption>
      <assumption>DeploymentsController sits at /api/deployments (not /api/admin/deployments) matching the task spec contract table.</assumption>
    </assumptions>
  </metadata>

</plan>
