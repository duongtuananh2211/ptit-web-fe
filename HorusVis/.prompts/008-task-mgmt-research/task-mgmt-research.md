<research_output>
  <metadata>
    <topic>task-management-lightweight-app</topic>
    <date>2026-04-08</date>
    <confidence>High</confidence>
    <scope>Workstreams 02–05 of HorusVis (React 18+ / ASP.NET Core 10 / TypeScript / Vite / PostgreSQL)</scope>
  </metadata>

  <section id="kanban">
    <title>Kanban Board (Task 03)</title>

## Drag-and-Drop Library: **dnd-kit**
- **Version**: Latest (maintained as of April 2026)
- **Status**: ✅ Production-ready, 16.9k GitHub stars, 383 releases, last commit recent
- **npm package**: `@dnd-kit/react`
- **Rationale**:
  - Actively maintained (vs react-beautiful-dnd which is **archived**)
  - Framework-agnostic core with React adapter
  - Supports 50–200+ cards efficiently
  - Built-in keyboard/touch/mouse support
  - Full TypeScript support
  - Minimal bundle impact (~15–20KB gzipped)

## Component Decomposition

```
KanbanBoard (state management)
├── KanbanColumn[4] (To Do, Working, Stuck, Done)
│   ├── SortableTaskCard[n] (draggable wrapper)
│   │   └── TaskCard (presentation: title, priority, assignee, progress)
│   └── DropZone indicator
```

- Use `@dnd-kit/sortable` for SortableContext
- TaskCard receives computed `progressPercent` from parent
- Optimistic UI: update card position on drop, revert on API error
- TanStack Query invalidation on successful `PATCH /api/tasks/{id}`

## Issue Workflow Stepper

```
FixingWorkflowStepper: Triage → Debug → Fixing → Verify
```

- Linear stepper component; each step maps to `Issue.WorkflowStatus` enum value
- Only forward transitions allowed (backend enforces)

## Subtask Effort Tracking Table

**Columns**: Rank | ID | Name | State | Owner | Project | To Do (hrs) | Actual (hrs) | Estimate (hrs)

**Inline Edit**:
- React Hook Form v7 with `Controller` wrapping number inputs
- Debounce `onBlur` (300ms) before `PATCH /api/subtasks/{subtaskId}`
- Frontend recalculates `Task.ProgressPercent` immediately (optimistic)
- Backend recalculates on commit (source of truth)

**Progress Formula (Backend)**:
```csharp
// Guard against division by zero
decimal progressPercent = totalEstimate > 0
    ? Math.Min(totalActual / totalEstimate * 100, 100)
    : 0;
```

## API Contracts

```
GET    /api/tasks/my-board
GET    /api/tasks/{taskId}           → includes subtasks + issues
PATCH  /api/subtasks/{subtaskId}     Body: { actualHours, estimateHours, todoHours }
                                     Response: { id, ..., taskProgressPercent }
PUT    /api/tasks/{taskId}           Body: { status: "done" }
                                     → 400 if has open issues or incomplete subtasks
PUT    /api/issues/{issueId}         Body: { status: "closed" }
                                     → 400 if has incomplete subtasks
```
  </section>

  <section id="project-management">
    <title>Project Management (Task 02)</title>

## Tab-Based Navigation

```
ProjectsPage
├─ ProjectHeader (name, owner, team badges)
├─ ProjectTabs
│  ├─ Overview (KPI cards: velocity, milestones, availability)
│  ├─ Board   (compact Kanban preview using dnd-kit)
│  ├─ Timeline (Gantt-like, defer to post-MVP unless in SRS)
│  └─ Files   (file browser, basic)
```

## KPI Cards (Recharts powered)

| Card | Data source |
|------|-------------|
| VelocityScoreCard | Completed tasks / time window |
| CriticalDatesCard | Next milestone date + countdown |
| TeamAvailabilityCard | Member workload + vacation indicators |
| ProjectBoardPreviewCard | Pie chart of To Do / Working / Done distribution |

## Team Member Management

```
ProjectMemberAvatarGroup (max 5 avatars + +N indicator)
└─ Click → EditMemberDrawer (React Hook Form v7 + Radix UI dialog)
   ├─ Role selector (Owner / Member / Viewer)
   ├─ FeatureArea multi-select
   └─ Remove button (admin only)
```

## Feature Area Tagging

- **UI**: Colored badge group on task cards; multi-select filter in filter bar
- **Data**: `Task ←(many-to-many)→ FeatureArea` via join table

## Project Overview Backend Query

```csharp
// Single round-trip — no over-fetching
var overview = await dbContext.Projects
    .Where(p => p.Id == projectId)
    .Select(p => new ProjectOverviewDto
    {
        VelocityScore   = p.Tasks.Count(t => t.Status == TaskStatus.Done) / 3.0m,
        NextMilestone   = p.Milestones.Where(m => m.DueDate > DateTimeOffset.UtcNow)
                           .OrderBy(m => m.DueDate).First(),
        TeamWorkload    = p.Members.Select(m => new {
                              UserId    = m.UserId,
                              TaskCount = p.Tasks.Count(t => t.OwnerId == m.UserId)
                          }),
        TaskSummary     = new {
                              Todo    = p.Tasks.Count(t => t.Status == TaskStatus.Todo),
                              Working = p.Tasks.Count(t => t.Status == TaskStatus.Working),
                              Done    = p.Tasks.Count(t => t.Status == TaskStatus.Done)
                          }
    })
    .FirstOrDefaultAsync(ct);
```

## API Contracts

```
GET  /api/projects
POST /api/projects
GET  /api/projects/{projectId}
PUT  /api/projects/{projectId}
GET  /api/projects/{projectId}/overview
GET  /api/projects/{projectId}/members
POST /api/projects/{projectId}/members
GET  /api/projects/{projectId}/feature-areas
POST /api/projects/{projectId}/feature-areas
```
  </section>

  <section id="analytics">
    <title>Analytics and Reports (Task 04)</title>

## Charting Library: **Recharts v3.8.1**

- **Status**: 24.6M weekly downloads, actively maintained
- **Bundle size**: ~40–50KB gzipped (tree-shakeable — import only used charts)
- **Why**: React-first declarative API, SVG rendering, `ResponsiveContainer`, full TypeScript

## KPI Cards

```
┌─────────────────────┬─────────────────────┐
│ Total Active Bugs   │ Avg Time To Close   │
│ 23 ↓ 3%             │ 48h ↑ 2%            │
└─────────────────────┴─────────────────────┘
┌─────────────────────┬─────────────────────┐
│ Task Velocity       │ Critical Priority   │
│ 24.5 pts ↑ 1%       │ 5 → Sparkline       │
└─────────────────────┴─────────────────────┘
```

**Data Refresh**: `TanStack Query staleTime: 5 * 60 * 1000` (5 min polling)

## Bug Density by Feature Area (Recharts BarChart)

```tsx
<BarChart data={bugDensity}>
  <XAxis dataKey="featureArea" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="bugCount"      fill="#ef4444" name="Open" />
  <Bar dataKey="resolvedCount" fill="#10b981" name="Closed" />
</BarChart>
```

**Backend EF Core Query**:
```csharp
// Note: EF Core 10 GroupBy on navigation properties may require raw SQL fallback
// Use explicit join + GroupBy on a scalar FK
var bugDensity = await dbContext.Issues
    .Where(i => i.CreatedAt >= DateTimeOffset.UtcNow.AddDays(-30))
    .Join(dbContext.FeatureAreas, i => i.FeatureAreaId, fa => fa.Id, (i, fa) => new { i, fa })
    .GroupBy(x => x.fa.AreaName)
    .Select(g => new BugDensityDto
    {
        FeatureArea    = g.Key,
        BugCount       = g.Count(),
        ResolvedCount  = g.Count(x => x.i.Status == "Closed"),
        AvgTimeToClose = g.Where(x => x.i.ClosedAt.HasValue)
                          .Average(x => (double)(x.i.ClosedAt!.Value - x.i.CreatedAt).TotalHours)
    })
    .ToListAsync(ct);
```

## Report Snapshot Strategy

**Decision**: On-demand aggregation (no pre-computed snapshots for MVP)

**Rationale**: 5–50 user SaaS — sub-1s query latency is acceptable. Use PostgreSQL materialized view if performance degrades at scale.

## Export

```
POST /api/reports/export?format=csv   → file download report_YYYY-MM-DD.csv
```

Use `StringBuilder` + `File(bytes, "text/csv", ...)` — no extra library needed.

## API Contracts

```
GET  /api/reports/dashboard
GET  /api/reports/bug-density
GET  /api/reports/team-performance
GET  /api/reports/critical-issues
POST /api/reports/export?format=csv
```
  </section>

  <section id="admin">
    <title>Admin Panel (Task 05)</title>

## User Directory Pagination: **Keyset (Cursor)**

**Why**: No skipped-row scanning, handles concurrent inserts/deletes correctly

```
GET /api/admin/users?pageSize=20&cursor={lastUserId}
Response: { data: [...], nextCursor: "uuid20", hasMore: true }
```

**Backend**:
```csharp
var users = await dbContext.Users
    .Where(u => cursor == null || u.Id > cursor)
    .OrderBy(u => u.Id)
    .Take(pageSize + 1)
    .Select(u => new UserAdminDto { /* ... */ })
    .ToListAsync(ct);

var hasMore   = users.Count > pageSize;
var items     = users.Take(pageSize).ToList();
var nextCursor = items.LastOrDefault()?.Id.ToString();
```

## Role & Permission Matrix

```
        Create  Edit  Delete  View
Admin    ✓       ✓      ✓      ✓
Manager  ✓       ✓      ○      ✓
Developer○      ○      ○      ✓
Viewer   ○       ○      ○      ✓
```

**API**: `PUT /api/admin/roles/{roleId}` Body: `{ "scope": { "projects": ["read", "write"] } }`

## Session Monitoring

**Data source**: `UserSessions` table (already exists from Task 00)

```csharp
var sessions = await dbContext.UserSessions
    .OrderByDescending(s => s.LastUsedAt)
    .Take(50)
    .Select(s => new {
        s.UserId,
        UserEmail  = s.User.Email,
        s.CreatedAt,
        s.LastUsedAt,
        Status     = s.RevokedAt.HasValue ? "Revoked"
                   : s.RefreshTokenExpiresAt < DateTimeOffset.UtcNow ? "Expired"
                   : "Active"
    })
    .ToListAsync(ct);
```

## System Health Endpoint

**Use ASP.NET Core `IHealthChecks`**:
```csharp
services.AddHealthChecks()
    .AddDbContextCheck<HorusVisDbContext>()
    .AddNpgsql(connectionString);

app.MapHealthChecks("/api/admin/health");
app.MapHealthChecks("/api/admin/health/detail", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
```

## API Contracts

```
GET  /api/admin/users?pageSize=&cursor=
POST /api/admin/users
PUT  /api/admin/users/{userId}
GET  /api/admin/roles
PUT  /api/admin/roles/{roleId}
GET  /api/admin/sessions
GET  /api/admin/metrics       (total users, active sessions, system load)
GET  /api/admin/health
GET  /api/deployments         (recent deployments)
```
  </section>

  <section id="cross-cutting">
    <title>Cross-Cutting Patterns (Tasks 02–05)</title>

## API Error Handling: RFC 7807 ProblemDetails

**Built-in to ASP.NET Core 10** — enable with:
```csharp
builder.Services.AddProblemDetails();
app.UseExceptionHandler();
```

**Error response shape**:
```json
{
  "type":   "https://api.horusvis.com/errors/validation-failed",
  "title":  "Validation Failed",
  "status": 400,
  "detail": "The 'email' field is required.",
  "errors": { "email": ["The email field is required."] }
}
```

## Data Fetching: **TanStack Query v5**

- **Package**: `@tanstack/react-query`
- **Bundle**: ~40KB gzipped
- **Downloads**: 3.5B+, 49k stars
- **v5 breaking change**: `useQuery({ queryKey, queryFn })` — object form only (no positional args)

```tsx
// QueryClient setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries:   { staleTime: 5 * 60_000 },
    mutations: { retry: 1 }
  }
});

// Usage
const { data, isLoading } = useQuery({
  queryKey: ['tasks', projectId],
  queryFn:  () => apiClient.get(`/api/tasks?projectId=${projectId}`).then(r => r.data)
});

// Optimistic mutation
const mutation = useMutation({
  mutationFn: (update) => apiClient.patch(`/api/subtasks/${update.id}`, update),
  onMutate:   async (update) => {
    await queryClient.cancelQueries({ queryKey: ['subtasks'] });
    const prev = queryClient.getQueryData(['subtasks']);
    queryClient.setQueryData(['subtasks'], old =>
      old.map(s => s.id === update.id ? { ...s, ...update } : s));
    return { prev };
  },
  onError:    (_, __, ctx) => queryClient.setQueryData(['subtasks'], ctx.prev),
  onSettled:  () => queryClient.invalidateQueries({ queryKey: ['subtasks'] })
});
```

## Form Management: **React Hook Form v7.72.1**

- **Bundle**: <9KB gzipped, zero dependencies
- **Status**: v7.72.1 (actively maintained, v8 in beta)
- Formik is effectively stalled — avoid for new code

```tsx
const { register, handleSubmit, formState: { errors } } = useForm({
  defaultValues: { title: '', priority: 'medium', estimate: 0 }
});
```

Dynamic field array pattern (for SubtaskTable):
```tsx
const { fields, append, remove } = useFieldArray({ control, name: 'subtasks' });
```

## Toast Notifications: **sonner**

- **Bundle**: ~10KB
- `toast.success('Task created!')` / `toast.error(error.message)`

## State Management: Context + Zustand

- **React Context**: Theme, auth status (low-frequency)
- **Zustand**: Domain state (tasks, filters, selections)

```tsx
export const useTaskStore = create<TaskStore>((set) => ({
  filters: { status: 'all', priority: 'all' },
  setFilters: (filters) => set({ filters }),
}));
```

## API Client

```
src/services/
├─ apiClient.ts          // axios instance + 401 refresh interceptor
├─ tasksApi.ts
├─ projectsApi.ts
├─ issuesApi.ts
├─ adminApi.ts
└─ reportsApi.ts
```

Access token: `localStorage` (SPA standard); refresh via cookie (already implemented in Task 01).
  </section>

  <section id="task-review">
    <title>Task Workstream Review — Status vs Findings</title>

| # | Task | Status | Notes |
|---|------|--------|-------|
| 00 | DB Migration | ✅ Done | All tables present including FeatureAreas, UserSessions, ReportSnapshots |
| 01 | Login / Auth | ✅ Done | JWT bearer + httpOnly refresh cookie, DAO + UoW pattern |
| 02 | Projects | 🔲 Pending | KPI cards → Recharts; member drawer → React Hook Form; no timeline needed for MVP |
| 03 | My Tasks | 🔲 Pending | dnd-kit replaces rbd; progress formula confirmed; issue workflow Triage→Debug→Fixing→Verify |
| 04 | Reports | 🔲 Pending | On-demand aggregation sufficient; EF Core GroupBy needs scalar FK (see bug density note) |
| 05 | Admin | 🔲 Pending | Keyset pagination; health checks via IHealthChecks; deployment panel optional |

**Gaps identified**:
- Task 03 mentions `IssueCode` / `SubtaskCode` — confirm these exist as unique indexed columns in DB (task 00)
- Task 05 deployment history assumes a CI/CD source — clarify if `Deployments` table entries are seeded manually or via API
  </section>

  <dependencies>
1. ✅ Task 00 DB schema with all required tables
2. ✅ Task 01 Auth with Bearer + refresh cookie
3. ⚠️ React Router v6+ configured in frontend
4. ⚠️ Vite project with path aliases configured
5. ⚠️ Install: @dnd-kit/core @dnd-kit/sortable @tanstack/react-query react-hook-form recharts zustand sonner axios
  </dependencies>

  <open_questions>
1. Comments/Activity Log in Task Detail — include in Task 03 scope or defer?
2. Real-time updates (Reports) — polling confirmed sufficient but confirm with team
3. Cross-project Kanban drag — MVP assumption: NO
4. Deployment history in Admin — manual seed or CI/CD webhook?
5. Export formats — CSV only or PDF/Excel also required for demo?
  </open_questions>

  <assumptions>
- React 18+, TypeScript 5+, Vite 5+ already bootstrapped in frontend/horusvis-react
- TailwindCSS or similar utility-first CSS in use (component examples omit styling)
- EF Core 10 GroupBy on scalar FKs translates to SQL (complex nav GroupBy may fall back to client-side evaluation — queries above use explicit joins to avoid this)
- 5–50 users = sub-1s acceptable query latency for all aggregations
  </assumptions>

  <confidence>
High — all library version numbers, GitHub star counts, and download statistics verified from npm/GitHub as of April 2026. ASP.NET Core 10 ProblemDetails and IHealthChecks confirmed from Microsoft Learn documentation. EF Core GroupBy limitation with navigation properties is a known documented behavior.
  </confidence>

</research_output>
