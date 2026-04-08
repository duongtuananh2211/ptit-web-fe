<objective>
Implement Reports Frontend Phase 5: build all 10 Reports components and replace the
ReportsPage scaffold. Components include 4 KPI cards, Bug Density BarChart, Team
Performance BarChart, Top Critical Issues list, rule-based Recommendation panel, a
manual Refresh button, and a CSV Export button.

Purpose: Delivers the complete visual Reports page built on the hooks from Phase 4,
using Recharts BarChart for the two chart panels and standard HTML/CSS for the rest.
Output: 11 new/modified files; `npm run build` passes with 0 TS errors.
</objective>

<context>
Detailed phase plan (Phase 5):
@.prompts/011-reports-plan/reports-plan.md

Task specification and component checklist:
@docs/outlines/tasks/04-reports/README.md

Reference UI screenshot:
@docs/outlines/stitch_horusvis/visual_analytics_dashboard/screen.png

Hooks and types from Phase 4 (read before building components):
@frontend/horusvis-react/src/hooks/useReports.ts
@frontend/horusvis-react/src/api/reportsApi.ts

Current scaffold page (to be replaced):
@frontend/horusvis-react/src/pages/ReportsPage.tsx

Auth store (for accessToken in Export button):
@frontend/horusvis-react/src/stores/auth-store-context.ts

Existing component example (for style/pattern reference):
@frontend/horusvis-react/src/components/admin/AdminMetricsBar.tsx
</context>

<requirements>
1. CREATE `frontend/horusvis-react/src/components/reports/` directory and build 10 components:

   ─────────────────────────────────────────────────────────────────────
   A. KpiCard.tsx
   ─────────────────────────────────────────────────────────────────────
   Props:
     label: string;
     value: number | string;
     trend?: number | null;   // percentage, e.g. 5.2 or -10.1
     isLoading?: boolean;
   Renders:
     - A card div with label on top, large value below.
     - If trend is defined and not null: show a small indicator
       (▲ green if positive, ▼ red if negative, — grey if 0).
     - isLoading: show grey skeleton placeholder for value area.

   ─────────────────────────────────────────────────────────────────────
   B. KpiCardGrid.tsx
   ─────────────────────────────────────────────────────────────────────
   Props: none (self-contained, calls useReportsDashboard internally)
   Uses: useReportsDashboard() from useReports.ts
   Renders 4 KpiCard instances in a CSS grid row:
     1. label="Total Active Bugs",  value=data.totalActiveBugs,  trend=data.totalActiveBugsTrend
     2. label="Avg Time to Close",  value=data.avgTimeToCloseHours (formatted as "{h:F1}h" or "--"),
        trend=data.avgTimeToCloseTrend
     3. label="Task Velocity",      value=data.taskVelocityPoints, trend=data.taskVelocityTrend
     4. label="Critical Priority",  value=data.criticalPriorityCount, trend=data.criticalPriorityTrend
   Pass isLoading={isLoading} to each KpiCard.

   ─────────────────────────────────────────────────────────────────────
   C. BugDensityChart.tsx
   ─────────────────────────────────────────────────────────────────────
   Uses: useBugDensity() from useReports.ts
   Renders Recharts BarChart with two bars per FeatureArea:
     - BarChart data={data ?? []}  width=500 height=300
     - XAxis dataKey="featureArea"
     - YAxis
     - Tooltip
     - Legend
     - Bar dataKey="openCount"     fill="#ef4444"  name="Open"
     - Bar dataKey="resolvedCount" fill="#22c55e"  name="Resolved"
   isLoading: show a grey skeleton box (same height as chart).
   isError:   show "Failed to load bug density data."

   ─────────────────────────────────────────────────────────────────────
   D. TeamPerformanceChart.tsx
   ─────────────────────────────────────────────────────────────────────
   Uses: useTeamPerformance() from useReports.ts
   Renders Recharts BarChart with one bar per team member:
     - BarChart data={data ?? []}  width=500 height=300
     - XAxis dataKey="fullName"
     - YAxis
     - Tooltip
     - Bar dataKey="tasksCompleted" fill="#6366f1" name="Tasks Completed"
   isLoading / isError: same skeleton/error pattern as BugDensityChart.

   ─────────────────────────────────────────────────────────────────────
   E. CriticalIssuesList.tsx
   ─────────────────────────────────────────────────────────────────────
   Uses: useCriticalIssues() from useReports.ts
   Renders a scrollable list of critical issue rows. Each row shows:
     - IssueCode (monospace badge)
     - Title (truncated to 60 chars)
     - Priority badge (colour-coded: Critical=red, High=orange, Medium=amber, Low=grey)
     - AssigneeName or "Unassigned" in grey
     - OpenedAt formatted as local date string
   isLoading: show 5 skeleton rows.
   isError:   show "Failed to load critical issues."
   Empty state: "No critical issues — great work!" if data.length === 0.

   ─────────────────────────────────────────────────────────────────────
   F. RecommendationPanel.tsx
   ─────────────────────────────────────────────────────────────────────
   Uses: useRecommendations() from useReports.ts
   Renders list of recommendation cards. Each card shows:
     - RuleKey as small all-caps label (e.g. "HIGH_BUG_DENSITY")
     - Title in bold
     - Detail text below
   isLoading: show 2 skeleton cards.
   isError:   show "Failed to load recommendations."
   Empty state: "No recommendations — everything looks healthy!"

   ─────────────────────────────────────────────────────────────────────
   G. RefreshButton.tsx
   ─────────────────────────────────────────────────────────────────────
   Props: onRefresh: () => void; isLoading?: boolean
   Renders a button with label "Refresh".
   isLoading: show spinner or "Refreshing..." label; disable during refresh.

   ─────────────────────────────────────────────────────────────────────
   H. ExportButton.tsx
   ─────────────────────────────────────────────────────────────────────
   Uses: useAuthStore() for accessToken
   Imports: downloadReportCsv from useReports.ts
   Local state: isExporting (boolean)
   On click:
     - Set isExporting = true
     - Call downloadReportCsv(accessToken!, projectId)
     - Set isExporting = false (in finally block)
   Renders button "Export CSV"; disabled while isExporting.
   Props: projectId?: string

   ─────────────────────────────────────────────────────────────────────
   I. ReportsHeader.tsx
   ─────────────────────────────────────────────────────────────────────
   Props:
     isLoading: boolean;
     onRefresh: () => void;
     projectId?: string;
   Renders:
     - <h1>Reports</h1>
     - RefreshButton (pass isLoading, onRefresh)
     - ExportButton (pass projectId)
   Layout: flex row with space between.

   ─────────────────────────────────────────────────────────────────────
   J. CapacityRoadmapCard.tsx  (MVP placeholder)
   ─────────────────────────────────────────────────────────────────────
   No props, no data fetch.
   Renders a card with:
     heading "Capacity & Roadmap"
     body "Capacity and roadmap data will be available in a future release."
   This satisfies the checklist item without requiring a backend data model.

2. REPLACE ReportsPage.tsx at `frontend/horusvis-react/src/pages/ReportsPage.tsx`:

   Implementation:
   - Local state: projectId (string | undefined, default undefined — all projects)
   - Import and use all 5 TanStack Query hooks from useReports.ts
   - isAnyLoading: combine isLoading flags from all 5 hooks (any true → loading)
   - onRefresh: call refetch() on all 5 hooks
   - Layout (vertical flex, full width):
       <ReportsHeader isLoading={isAnyLoading} onRefresh={handleRefresh} projectId={projectId} />
       <KpiCardGrid />
       <section className="reports-charts-row">
         <BugDensityChart />
         <TeamPerformanceChart />
       </section>
       <section className="reports-bottom-row">
         <CriticalIssuesList />
         <RecommendationPanel />
       </section>
       <CapacityRoadmapCard />

3. IMPLEMENTATION CONSTRAINTS
   - Use Recharts from "recharts" — it was installed in Phase 4.
   - Do NOT use ResponsiveContainer in Phase 5 (use fixed width=500 height=300 for simplicity).
   - Do NOT use class components; function components + hooks only.
   - TypeScript strict mode: no implicit any. All props interfaces must be explicitly typed.
   - Styling: use className strings (class names in CSS); do NOT add a CSS-in-JS library.
     Basic inline styles are acceptable if CSS classes are impractical for a specific element.
   - Do NOT add new npm packages beyond recharts (already installed in Phase 4).
</requirements>

<output>
Files to create:
- frontend/horusvis-react/src/components/reports/KpiCard.tsx
- frontend/horusvis-react/src/components/reports/KpiCardGrid.tsx
- frontend/horusvis-react/src/components/reports/BugDensityChart.tsx
- frontend/horusvis-react/src/components/reports/TeamPerformanceChart.tsx
- frontend/horusvis-react/src/components/reports/CriticalIssuesList.tsx
- frontend/horusvis-react/src/components/reports/RecommendationPanel.tsx
- frontend/horusvis-react/src/components/reports/RefreshButton.tsx
- frontend/horusvis-react/src/components/reports/ExportButton.tsx
- frontend/horusvis-react/src/components/reports/ReportsHeader.tsx
- frontend/horusvis-react/src/components/reports/CapacityRoadmapCard.tsx

Files to modify:
- frontend/horusvis-react/src/pages/ReportsPage.tsx (replaced)
</output>

<verification>
Before declaring complete:
1. Run: cd frontend/horusvis-react && npm run build
   → Must exit 0 with zero TypeScript errors
2. Confirm all 10 components are created under src/components/reports/
3. Confirm ReportsPage.tsx no longer renders FeaturePage scaffold
4. Confirm BugDensityChart and TeamPerformanceChart use Recharts BarChart (not any other library)
5. Confirm CriticalIssuesList handles empty state and isError state
6. Confirm RecommendationPanel handles empty state and isError state
7. Confirm ExportButton calls downloadReportCsv with accessToken (not undefined)
8. Confirm RefreshButton is disabled while isLoading is true
9. Confirm KpiCard shows trend indicator (▲/▼/—) when trend prop is not null
10. Confirm CapacityRoadmapCard renders without making any API call
</verification>

<summary_requirements>
Create `.prompts/019-reports-fe-ui-do/SUMMARY.md`

Template:
# Reports FE UI — SUMMARY
**{one-liner}**

## Version
v1

## Key Findings
- {components created}
- {Recharts usage}
- {loading/error/empty states handled}

## Files Created
- list all created/modified files

## Decisions Needed
- projectId filter: currently hardcoded undefined (all projects). A project selector in
  ReportsHeader could be added in a future iteration.

## Blockers
{build errors if any, or None}

## Next Step
Manual smoke test: log in, navigate to /reports, verify KPI cards and charts render.
</summary_requirements>

<success_criteria>
- All 10 component files created under src/components/reports/
- ReportsPage.tsx replaced with real implementation (no FeaturePage import)
- KpiCard: value + trend indicator (▲/▼/—) + loading skeleton
- KpiCardGrid: 4 KPI cards connected to useReportsDashboard
- BugDensityChart: Recharts BarChart, 2 bars (Open/Resolved), error/loading states
- TeamPerformanceChart: Recharts BarChart, 1 bar (Tasks Completed), error/loading states
- CriticalIssuesList: rows with code badge, priority colour, empty state, error state
- RecommendationPanel: rule cards with RuleKey label, empty state, error state
- RefreshButton: disabled during loading
- ExportButton: triggers downloadReportCsv, disabled during export
- CapacityRoadmapCard: static placeholder, no API call
- `npm run build` passes with 0 TS errors
- SUMMARY.md created at .prompts/019-reports-fe-ui-do/SUMMARY.md
</success_criteria>
