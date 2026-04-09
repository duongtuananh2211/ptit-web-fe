<objective>
Implement Projects Frontend Phase 4: build ProjectDetailPage, ProjectHeader, ProjectTabs,
and the fully-wired Overview tab (4 KPI cards using Recharts). Board, Timeline, and Files tabs
are stubs. VelocityScoreCard uses a simple number display (no sparkline needed — only a single
aggregated score is returned). Build must pass with 0 TS errors.

Purpose: Delivers the project detail shell and all Overview tab visualisations before Phase 5
fills in the Board tab and management drawers.
Output: 9 new files + 1 modified (router); `npm run build` passes with 0 TS errors.
</objective>

<context>
Detailed phase plan (Phase 4):
@.prompts/009-projects-plan/projects-plan.md

Hooks and types from Phase 3:
@frontend/horusvis-react/src/hooks/useProjects.ts
@frontend/horusvis-react/src/api/projectsTypes.ts
@frontend/horusvis-react/src/stores/projects-store-context.ts

Auth store (for comparing ownerId with current user):
@frontend/horusvis-react/src/stores/auth-store-context.ts

Existing component for stub pattern:
@frontend/horusvis-react/src/components/FeaturePage.tsx

Reference UI screenshot:
@docs/outlines/stitch_horusvis/dashboard_detailed_view_v2/screen.png

Current router (to confirm /projects/:id exists from Phase 3):
@frontend/horusvis-react/src/app/router.tsx
</context>

<requirements>

──────────────────────────────────────────────────────────
1. REPLACE ProjectDetailPage.tsx (Phase 3 stub → real implementation)
──────────────────────────────────────────────────────────

`frontend/horusvis-react/src/pages/ProjectDetailPage.tsx`:
- Extract `id` with `useParams<{ id: string }>()`.
- Call `useProjectDetail(id ?? null)` and `setSelectedProjectId(id)` on mount.
- Loading: full-page skeleton ("Loading project...").
- Error: "Failed to load project. Does it exist?"
- Renders: `<ProjectHeader project={data} />` + `<ProjectTabs projectId={id} />`

──────────────────────────────────────────────────────────
2. CREATE ProjectHeader.tsx
──────────────────────────────────────────────────────────

`frontend/horusvis-react/src/components/projects/ProjectHeader.tsx`
Props: `project: ProjectDetailResponse`

Renders:
- ProjectKey as a coloured badge (background uses a hash of projectKey → CSS class or inline hue).
- ProjectName as `<h1>`.
- Status chip (Draft=grey, Active=green, OnHold=amber, Archived=red).
- Owner avatar circle (initials from ownerDisplayName) + ownerDisplayName text.
- `<ProjectMemberAvatarGroup members={project.members} />` (up to 5 + overflow).
- Deep-link buttons (plain `<a>` or `useNavigate`):
    - "My Tasks" → `/my-tasks?projectId={project.id}`
    - "Reports"  → `/reports?projectId={project.id}`
- Layout: flex row with space-between.

──────────────────────────────────────────────────────────
3. CREATE ProjectTabs.tsx
──────────────────────────────────────────────────────────

`frontend/horusvis-react/src/components/projects/ProjectTabs.tsx`
Props: `projectId: string`

Implementation:
- Local state: `activeTab: 'overview' | 'board' | 'timeline' | 'files'` (default: 'overview').
- Tab bar: 4 buttons — Overview | Board | Timeline | Files.
- Content per tab:
    - overview  → `<ProjectOverviewCards projectId={projectId} />`
    - board     → `<div>Board tab — Phase 5</div>` (placeholder)
    - timeline  → `<FeaturePage title="Timeline" description="Coming soon" endpoint="" notes={[]} accentClass="accent-cobalt" />`
    - files     → `<FeaturePage title="Files" description="Coming soon" endpoint="" notes={[]} accentClass="accent-cobalt" />`

──────────────────────────────────────────────────────────
4. CREATE ProjectOverviewCards.tsx
──────────────────────────────────────────────────────────

`frontend/horusvis-react/src/components/projects/ProjectOverviewCards.tsx`
Props: `projectId: string`

- Calls `useProjectOverview(projectId)`.
- isLoading: show 4 skeleton cards.
- isError: show "Failed to load overview."
- Renders 4 cards in a CSS grid (2 columns):
    1. `<VelocityScoreCard score={data.velocityScore} />`
    2. `<CriticalDatesCard milestone={data.nextMilestone} />`
    3. `<TeamAvailabilityCard workload={data.teamWorkload} />`
    4. `<ProjectBoardPreviewCard summary={data.taskSummary} />`

──────────────────────────────────────────────────────────
5. CREATE VelocityScoreCard.tsx
──────────────────────────────────────────────────────────

`frontend/horusvis-react/src/components/projects/VelocityScoreCard.tsx`
Props: `score: number`

Renders:
- Card with heading "Velocity".
- Large number: `{score}` (1 decimal place).
- Sub-label: "tasks/week (last 3 weeks)".
- No sparkline needed — Phase 4 only returns the single aggregated score.

──────────────────────────────────────────────────────────
6. CREATE CriticalDatesCard.tsx
──────────────────────────────────────────────────────────

`frontend/horusvis-react/src/components/projects/CriticalDatesCard.tsx`
Props: `milestone: MilestoneDto` (which is `{ title: string; dueDate: string } | null`)

Renders:
- Card with heading "Critical Dates".
- If milestone is null: "No upcoming milestones."
- If milestone present: show Title, DueDate formatted as local date, days remaining
    - `Math.ceil((new Date(milestone.dueDate).getTime() - Date.now()) / 86_400_000)` → "{n} days"
    - If past due: show "Overdue by {n} days" in red.
    - No date-fns needed — use built-in Date arithmetic.

──────────────────────────────────────────────────────────
7. CREATE TeamAvailabilityCard.tsx
──────────────────────────────────────────────────────────

`frontend/horusvis-react/src/components/projects/TeamAvailabilityCard.tsx`
Props: `workload: TeamWorkloadItem[]`

Renders:
- Card with heading "Team Workload".
- If workload is empty: "No active task assignments."
- Recharts BarChart (horizontal layout):
    - `layout="vertical"` — member name on Y axis, task count on X axis.
    - `<ResponsiveContainer width="100%" height={Math.max(100, workload.length * 40)}>`
    - `<YAxis dataKey="displayName" type="category" width={100} />`
    - `<XAxis type="number" />`
    - `<Bar dataKey="taskCount" fill="#6366f1" />`
    - `<Tooltip />`

──────────────────────────────────────────────────────────
8. CREATE ProjectBoardPreviewCard.tsx (KPI card — NOT the full board tab)
──────────────────────────────────────────────────────────

`frontend/horusvis-react/src/components/projects/ProjectBoardPreviewCard.tsx`
Props: `summary: TaskSummaryDto`

Renders:
- Card with heading "Task Distribution".
- Recharts PieChart with 4 slices:
    - { name: "Todo",    value: summary.todo,    fill: "#94a3b8" }
    - { name: "Working", value: summary.working, fill: "#3b82f6" }
    - { name: "Stuck",   value: summary.stuck,   fill: "#f97316" }
    - { name: "Done",    value: summary.done,    fill: "#22c55e" }
- `<Tooltip />`
- `<Legend />`
- `<PieChart width={200} height={200}>`
- Total task count displayed below as "{total} total tasks".
- If all values are 0: show "No tasks yet."

──────────────────────────────────────────────────────────
9. CREATE ProjectMemberAvatarGroup.tsx
──────────────────────────────────────────────────────────

`frontend/horusvis-react/src/components/projects/ProjectMemberAvatarGroup.tsx`
Props: `members: ProjectMemberDto[]; maxVisible?: number` (default 5)

Renders:
- Up to `maxVisible` avatar circles, each showing initials (first char of each word in displayName).
- Overflow badge: "+{n}" if members.length > maxVisible.
- Inline flex row with negative margin overlap (standard avatar stack).
- Clicking the group: no action in Phase 4 (Phase 5 opens EditMemberDrawer).

──────────────────────────────────────────────────────────
10. CONSTRAINTS
──────────────────────────────────────────────────────────
- Use Recharts from "recharts" (already installed). Import only used primitives.
- Use ResponsiveContainer for TeamAvailabilityCard (fluid width).
- PieChart in ProjectBoardPreviewCard uses fixed width=200 height=200 (not responsive).
- No new npm packages to install.
- TypeScript strict mode — no implicit any.
</requirements>

<output>
Files to create:
- frontend/horusvis-react/src/components/projects/ProjectHeader.tsx
- frontend/horusvis-react/src/components/projects/ProjectTabs.tsx
- frontend/horusvis-react/src/components/projects/ProjectOverviewCards.tsx
- frontend/horusvis-react/src/components/projects/VelocityScoreCard.tsx
- frontend/horusvis-react/src/components/projects/CriticalDatesCard.tsx
- frontend/horusvis-react/src/components/projects/TeamAvailabilityCard.tsx
- frontend/horusvis-react/src/components/projects/ProjectBoardPreviewCard.tsx
- frontend/horusvis-react/src/components/projects/ProjectMemberAvatarGroup.tsx

Files to modify:
- frontend/horusvis-react/src/pages/ProjectDetailPage.tsx (stub → real implementation)
</output>

<verification>
Before declaring complete:
1. Run: cd frontend/horusvis-react && npm run build
   → Must exit 0 with zero TypeScript errors
2. Confirm ProjectDetailPage extracts id from useParams and calls useProjectDetail
3. Confirm ProjectTabs renders 3 stub tabs and 1 real tab (overview)
4. Confirm ProjectOverviewCards calls useProjectOverview(projectId)
5. Confirm CriticalDatesCard handles null milestone correctly
6. Confirm TeamAvailabilityCard uses ResponsiveContainer
7. Confirm ProjectBoardPreviewCard uses PieChart with 4 slices
8. Confirm ProjectMemberAvatarGroup shows overflow badge
9. Confirm no new npm packages were installed
</verification>

<summary_requirements>
Create `.prompts/023-projects-fe-detail-do/SUMMARY.md`

Template:
# Projects FE Detail Page — SUMMARY
**{one-liner}**

## Version
v1

## Key Findings
- {components built}
- {chart types used}
- {milestone handling}

## Files Created
- list all created/modified files

## Decisions Needed
- Board tab placeholder will be replaced in Phase 5.
- ProjectMemberAvatarGroup click action deferred to Phase 5 (EditMemberDrawer).

## Blockers
{build errors if any, or None}

## Next Step
Run Phase 5: `024-projects-fe-board-do.md`
</summary_requirements>

<success_criteria>
- 9 component/page files created (8 new + 1 modified)
- ProjectDetailPage: useParams, useProjectDetail, loading/error/render states
- ProjectHeader: key badge, status chip, owner, avatars, deep-links
- ProjectTabs: 4 tabs, overview wired, others are stubs
- ProjectOverviewCards: 4 cards in grid, loading/error states
- VelocityScoreCard: score + sub-label, no sparkline
- CriticalDatesCard: null-safe, days countdown, past-due detection
- TeamAvailabilityCard: Recharts horizontal BarChart with ResponsiveContainer
- ProjectBoardPreviewCard: Recharts PieChart with 4 coloured slices + legend
- ProjectMemberAvatarGroup: initials, max 5 + overflow
- `npm run build` passes with 0 TS errors
- SUMMARY.md created at .prompts/023-projects-fe-detail-do/SUMMARY.md
</success_criteria>
