<objective>
Implement Reports Frontend Phase 4: install recharts, define all TypeScript DTO types,
create the reportsApi.ts API function layer, and build useReports.ts TanStack Query hooks
(5-minute staleTime). This phase establishes the complete data contract and fetching
infrastructure for the Reports page before UI components are built in Phase 5.

Purpose: Gives Phase 5 a fully-typed, hook-based data layer — no direct fetch calls in
components, no untyped any casts.
Output: 3 new/modified files + recharts in package.json; `npm run build` passes with 0 TS errors.
</objective>

<context>
Detailed phase plan (Phase 4):
@.prompts/011-reports-plan/reports-plan.md

Task specification:
@docs/outlines/tasks/04-reports/README.md

Current API layer (read before editing — learn buildUrl and auth patterns):
@frontend/horusvis-react/src/api/httpClient.ts
@frontend/horusvis-react/src/api/adminApi.ts

Auth store (for accessing accessToken in hooks):
@frontend/horusvis-react/src/stores/auth-store-context.ts
@frontend/horusvis-react/src/stores/auth-store.tsx

package.json (check if recharts already present):
@frontend/horusvis-react/package.json
</context>

<requirements>
1. INSTALL RECHARTS
   Run inside frontend/horusvis-react/:
     npm install recharts@^3.8
   Verify recharts appears in package.json dependencies after install.
   Do NOT install any other chart library.

2. CREATE reportsApi.ts at `frontend/horusvis-react/src/api/reportsApi.ts`

   TypeScript types to export:
   ```typescript
   export type ReportDashboardDto = {
     totalActiveBugs: number;
     avgTimeToCloseHours: number | null;
     taskVelocityPoints: number;
     criticalPriorityCount: number;
     totalActiveBugsTrend: number | null;
     avgTimeToCloseTrend: number | null;
     taskVelocityTrend: number | null;
     criticalPriorityTrend: number | null;
   };

   export type BugDensityItemDto = {
     featureArea: string;
     openCount: number;
     resolvedCount: number;
     avgTimeToCloseHours: number | null;
   };

   export type TeamPerformanceItemDto = {
     userId: string;
     fullName: string;
     avatarUrl: string | null;
     tasksCompleted: number;
     totalPoints: number;
   };

   export type CriticalIssueDto = {
     id: string;
     issueCode: string;
     title: string;
     priority: string;
     severity: string;
     status: string;
     assigneeName: string | null;
     openedAt: string;
     dueDate: string | null;
   };

   export type RecommendationItemDto = {
     ruleKey: string;
     title: string;
     detail: string;
   };
   ```

   API functions to export (all accept token: string as first argument, use apiGetAuth
   from httpClient.ts):
   ```typescript
   fetchReportsDashboard(token: string, projectId?: string): Promise<ReportDashboardDto>
     → GET /api/reports/dashboard?projectId={projectId}  (omit if undefined)

   fetchBugDensity(token: string, projectId?: string, days?: number): Promise<BugDensityItemDto[]>
     → GET /api/reports/bug-density?projectId={projectId}&days={days}  (omit if undefined)

   fetchTeamPerformance(token: string, projectId?: string, days?: number): Promise<TeamPerformanceItemDto[]>
     → GET /api/reports/team-performance?projectId={projectId}&days={days}  (omit if undefined)

   fetchCriticalIssues(token: string, projectId?: string, topN?: number): Promise<CriticalIssueDto[]>
     → GET /api/reports/critical-issues?projectId={projectId}&topN={topN}  (omit if undefined)

   fetchRecommendations(token: string, projectId?: string): Promise<RecommendationItemDto[]>
     → GET /api/reports/recommendations?projectId={projectId}  (omit if undefined)

   exportReportCsv(token: string, projectId?: string): Promise<Blob>
     → POST /api/reports/export?format=csv&projectId={projectId}
     → Returns Response.blob() (NOT json()); use raw fetch + buildUrl pattern manually OR
       extend httpClient with a minimal apiPostAuthBlob helper.
       The result is used for browser download (URL.createObjectURL).
   ```

   Query param building: use URLSearchParams and only append params that are not undefined/null.
   Use apiGetAuth<T> from httpClient.ts for all GET functions.

3. CREATE useReports.ts at `frontend/horusvis-react/src/hooks/useReports.ts`

   Requirements:
   - Import useAuthStore from stores/auth-store-context.ts (or auth-store.tsx)
   - Import all 5 GET fetch functions from reportsApi.ts
   - All hooks use TanStack Query v5 useQuery
   - staleTime: 5 * 60_000 (5 minutes) on every query
   - All queries are DISABLED when accessToken is null (enabled: !!accessToken)
   - Query key patterns: ['reports', 'dashboard', projectId ?? 'all'], etc.

   Export these 5 hooks:
   ```typescript
   export function useReportsDashboard(projectId?: string)
   export function useBugDensity(projectId?: string, days?: number)
   export function useTeamPerformance(projectId?: string, days?: number)
   export function useCriticalIssues(projectId?: string, topN?: number)
   export function useRecommendations(projectId?: string)
   ```

   Each hook returns the full useQuery result object (data, isLoading, isError, refetch, etc.).

4. EXPORT HELPER — Also export a standalone async function from useReports.ts (NOT a hook):
   ```typescript
   export async function downloadReportCsv(token: string, projectId?: string): Promise<void>
   ```
   Implementation:
   - Call exportReportCsv(token, projectId) → blob
   - Create object URL: URL.createObjectURL(blob)
   - Create <a> element, set href + download attribute with dated filename
   - Programmatically click, then revokeObjectURL — standard browser download pattern.
   This is called from a button in Phase 5, not used as a hook.

5. IMPLEMENTATION CONSTRAINTS
   - Do NOT use axios. Use native fetch via apiGetAuth and httpClient patterns.
   - Do NOT add any state management beyond what TanStack Query provides.
   - Hooks directory (src/hooks/) currently empty — create it as a standard module directory.
   - TypeScript strict mode is on; no implicit any. All return types must be explicit.
</requirements>

<output>
File to modify:
- frontend/horusvis-react/package.json (recharts added by npm install)

Files to create:
- frontend/horusvis-react/src/api/reportsApi.ts
- frontend/horusvis-react/src/hooks/useReports.ts
</output>

<verification>
Before declaring complete:
1. Run: cd frontend/horusvis-react && npm run build
   → Must exit 0 with 0 TypeScript errors
2. Confirm recharts is listed in package.json dependencies
3. Confirm reportsApi.ts exports 5 DTO types + 6 functions (5 GET + 1 export)
4. Confirm useReports.ts exports 5 hooks + downloadReportCsv function
5. Confirm all hooks have staleTime: 5 * 60_000 and enabled: !!accessToken guard
6. Confirm exportReportCsv function handles Blob response (NOT JSON)
7. Confirm query keys follow ['reports', endpoint, projectId ?? 'all'] pattern
</verification>

<summary_requirements>
Create `.prompts/018-reports-fe-api-do/SUMMARY.md`

Template:
# Reports FE API Layer — SUMMARY
**{one-liner}**

## Version
v1

## Key Findings
- {recharts version installed}
- {API functions created}
- {hook patterns used}

## Files Created
- list all created/modified files

## Decisions Needed
- projectId source: from URL params (useParams) or global store? Phase 5 needs to decide.

## Blockers
{build errors if any, or None}

## Next Step
Run Phase 5: `019-reports-fe-ui-do.md`
</summary_requirements>

<success_criteria>
- recharts@^3.8 installed and in package.json
- reportsApi.ts: 5 DTO type exports, 6 API function exports
- All GET functions use apiGetAuth from httpClient
- exportReportCsv returns Promise<Blob> (not JSON)
- useReports.ts: 5 hook exports + downloadReportCsv export
- All hooks: staleTime 5min, enabled guard, typed return
- downloadReportCsv: creates object URL, clicks <a>, revokes URL
- `npm run build` passes with 0 TS errors
- SUMMARY.md created at .prompts/018-reports-fe-api-do/SUMMARY.md
</success_criteria>
