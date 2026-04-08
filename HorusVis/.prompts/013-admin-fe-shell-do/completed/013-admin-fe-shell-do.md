<objective>
Implement Admin Phase 4: install required npm packages, create auth context/store,
extend the HTTP client with Bearer auth support, build the typed adminApi.ts,
add a RequireAdminRole route guard, and replace the AdminPage scaffold with a working
shell containing AdminSearchBar and AdminMetricsBar.

Purpose: Establishes the entire frontend foundation for the admin feature — auth state,
typed API layer, and the page shell — before Phase 5 and 6 components are plugged in.
Output: 8 new/modified files in frontend/horusvis-react/src/; npm build passes with 0 TS errors.
</objective>

<context>
Existing plan (phases 4–6 detail):
@.prompts/012-admin-plan/admin-plan.md

Task specification:
@docs/outlines/tasks/05-admin/README.md

Reference UI (admin user management screen):
@docs/outlines/stitch_horusvis/saas_user_management/screen.png

Current frontend state (read before editing):
@frontend/horusvis-react/src/api/httpClient.ts
@frontend/horusvis-react/src/app/AppProviders.tsx
@frontend/horusvis-react/src/app/router.tsx
@frontend/horusvis-react/src/pages/AdminPage.tsx
@frontend/horusvis-react/src/stores/app-shell-store.tsx
@frontend/horusvis-react/src/stores/app-shell-store-context.ts
@frontend/horusvis-react/package.json
@frontend/horusvis-react/src/lib/env.ts
</context>

<requirements>
1. PACKAGE INSTALLATION
   Run inside frontend/horusvis-react/:
     npm install @tanstack/react-query@^5 react-hook-form@^7 sonner
   Do NOT install axios — use native fetch via the existing httpClient pattern.
   Verify additions appear in package.json dependencies after install.

2. QUERYCLIENT PROVIDER
   Wrap children in AppProviders.tsx with QueryClientProvider.
   Create QueryClient with default options:
     staleTime: 30_000
     retry: 1
   Place QueryClientProvider as the outermost wrapper (above AppShellStoreProvider).

3. AUTH CONTEXT/STORE
   No auth store currently exists. Create one following the split-file pattern used by
   the existing AppShellStore (context type in *-context.ts, provider + hook in *.tsx).

   Create frontend/horusvis-react/src/stores/auth-store-context.ts:
     export type AuthStoreContext = {
       accessToken: string | null;
       userRole: string | null;
       login: (token: string, role: string) => void;
       logout: () => void;
     }
     export const AuthStoreContext = React.createContext<AuthStoreContext | null>(null);

   Create frontend/horusvis-react/src/stores/auth-store.tsx:
     - Reads initial accessToken from localStorage.getItem('access_token')
     - Reads initial userRole from localStorage.getItem('user_role')
     - login(token, role): setAccessToken(token), setUserRole(role), persists both to localStorage
     - logout(): clears state and localStorage keys
     - Exposes useAuthStore(): returns context (throw if null, i.e., used outside provider)
     - AuthStoreProvider wraps children with AuthStoreContext.Provider

   Register AuthStoreProvider in AppProviders.tsx (inside QueryClientProvider).

4. HTTP CLIENT AUTH EXTENSIONS
   Extend frontend/horusvis-react/src/api/httpClient.ts.
   Add FOUR new exported functions (do NOT remove existing apiGet):

   export async function apiGetAuth<T>(path: string, token: string, init?: RequestInit): Promise<T>
   export async function apiPostAuth<T>(path: string, body: unknown, token: string): Promise<T>
   export async function apiPutAuth<T>(path: string, body: unknown, token: string): Promise<T>
   export async function apiDeleteAuth(path: string, token: string): Promise<void>

   All four must:
   - Set "Authorization": `Bearer ${token}` header
   - Set "Accept": "application/json"
   - apiPostAuth/apiPutAuth also set "Content-Type": "application/json" and JSON.stringify body
   - Throw Error with `${METHOD} ${path} failed with status ${response.status}` on !response.ok
   - apiDeleteAuth: no JSON body, no return value; throw on !response.ok (except 204 which IS ok)

5. ADMIN API LAYER
   Create frontend/horusvis-react/src/api/adminApi.ts.

   TypeScript types to define:
     export type UserAdminDto = {
       id: string; username: string; email: string; fullName: string;
       roleCode: string; roleName: string; status: string;
       lastLoginAt: string | null; createdAt: string;
     }
     export type PagedUsersResponse = { data: UserAdminDto[]; nextCursor: string | null; hasMore: boolean; }
     export type CreateUserRequest = { username: string; email: string; fullName: string; password: string; roleCode: string; }
     export type UpdateUserRequest = { fullName?: string; email?: string; status?: string; roleCode?: string; }
     export type PermissionScopeDto = { id: string; scope: string; description: string | null; }
     export type RoleAdminDto = { id: string; roleCode: string; roleName: string; isSystem: boolean; permissions: PermissionScopeDto[]; }
     export type SessionAdminDto = { id: string; userId: string; userEmail: string; createdAt: string; lastUsedAt: string | null; refreshTokenExpiresAt: string; revokedAt: string | null; displayStatus: 'Active' | 'Expired' | 'Revoked'; }
     export type MetricsDto = { totalUsers: number; activeSessions: number; avgCpuLoadPercent: number; avgMemoryLoadPercent: number; }
     export type NodeAdminDto = { id: string; nodeName: string; environment: string; cpuLoadPercent: number | null; memoryLoadPercent: number | null; status: string; lastHeartbeatAt: string | null; }
     export type DeploymentAdminDto = { id: string; environment: string; versionLabel: string; startedAt: string; finishedAt: string | null; status: string; triggeredByUserEmail: string | null; }
     export type HealthResponse = { status: string; checks: Array<{ name: string; status: string }>; }

   API functions (all accept token: string as last argument):
     fetchAdminUsers(token: string, cursor?: string, pageSize?: number): Promise<PagedUsersResponse>
       → GET /api/admin/users?cursor={cursor}&pageSize={pageSize}
         (omit params when undefined/null)
     createAdminUser(req: CreateUserRequest, token: string): Promise<UserAdminDto>
       → POST /api/admin/users
     updateAdminUser(userId: string, req: UpdateUserRequest, token: string): Promise<UserAdminDto>
       → PUT /api/admin/users/{userId}
     fetchAdminRoles(token: string): Promise<RoleAdminDto[]>
       → GET /api/admin/roles
     updateRolePermissions(roleId: string, permissionScopes: string[], token: string): Promise<void>
       → PUT /api/admin/roles/{roleId}  body: { permissionScopes }
     fetchAdminSessions(token: string): Promise<SessionAdminDto[]>
       → GET /api/admin/sessions
     revokeSession(sessionId: string, token: string): Promise<void>
       → DELETE /api/admin/sessions/{sessionId}
     fetchAdminMetrics(token: string): Promise<MetricsDto>
       → GET /api/admin/metrics
     fetchAdminNodes(token: string): Promise<NodeAdminDto[]>
       → GET /api/admin/nodes
     fetchAdminHealth(token: string): Promise<HealthResponse>
       → GET /api/admin/health
     fetchDeployments(take: number, token: string): Promise<DeploymentAdminDto[]>
       → GET /api/deployments?take={take}

6. ROUTE GUARD
   Create frontend/horusvis-react/src/app/RequireAdminRole.tsx:
     - Reads userRole from useAuthStore()
     - If userRole !== 'admin': return <Navigate to="/" replace />
     - Otherwise: return <Outlet /> (or accept children prop)
   
   Update frontend/horusvis-react/src/app/router.tsx:
     Wrap the /admin route with RequireAdminRole as layout route.
     Pattern:
       {
         element: <RequireAdminRole />,
         children: [{ path: "/admin", element: <AdminPage /> }]
       }

7. ADMINSEARCHBAR COMPONENT
   Create frontend/horusvis-react/src/components/admin/AdminSearchBar.tsx:
     Props: value: string; onChange: (v: string) => void
     Implementation:
       - Local debounced state: 300ms setTimeout before calling onChange
       - Renders: <input type="search" placeholder="Search users..." value={localValue} onChange={...} />
       - Style: full-width input, basic padding, rounded border
       - Clean up timeout on unmount

8. ADMINMETRICSBAR COMPONENT
   Create frontend/horusvis-react/src/components/admin/AdminMetricsBar.tsx:
     Implementation:
       - useAuthStore() to get accessToken
       - useQuery({ queryKey: ['admin', 'metrics'], queryFn: () => fetchAdminMetrics(accessToken!) })
         (skip query if accessToken is null: enabled: !!accessToken)
       - Renders 3 metric cards inside a flex row:
           Card 1: "Total Users"     → data?.totalUsers ?? '--'
           Card 2: "Active Sessions" → data?.activeSessions ?? '--'
           Card 3: "Avg CPU Load"    → data ? `${data.avgCpuLoadPercent.toFixed(1)}%` : '--'
       - isLoading: show skeleton (grey box) per card
       - isError: show '--' per card

9. ADMINPAGE SHELL
   Replace frontend/horusvis-react/src/pages/AdminPage.tsx entirely.
   New implementation:
     - Read accessToken and userRole from useAuthStore()
     - Local state: searchTerm (string, "")
     - Layout:
         <div className="admin-page">
           <header>
             <h1>Admin</h1>
             <AdminSearchBar value={searchTerm} onChange={setSearchTerm} />
           </header>
           <AdminMetricsBar />
           {/* Placeholder sections — replaced in Phase 5+6 */}
           <section data-section="user-directory">
             <p>User directory will be added in Phase 5.</p>
           </section>
           <section data-section="roles">
             <p>Role permission matrix will be added in Phase 6.</p>
           </section>
           <section data-section="sessions">
             <p>Session monitoring will be added in Phase 6.</p>
           </section>
           <section data-section="system">
             <p>System load and deployments will be added in Phase 6.</p>
           </section>
         </div>
</requirements>

<implementation>
- Follow the EXACT file split pattern from AppShellStore: context type in -context.ts, provider + hook in .tsx.
- Do NOT use class components; function components + hooks only.
- Do NOT add Zustand, Redux, or any state management lib beyond React context.
- Query keys follow ['admin', 'resource'] pattern for easy invalidation in later phases.
- URL building: always use buildUrl() from httpClient.ts (it handles base URL normalization).
  The adminApi functions call apiGetAuth/apiPostAuth/etc. — they should not build URLs themselves;
  just pass the path string and the auth functions handle buildUrl internally.
- For query params in fetch: construct via URLSearchParams and append to path if needed;
  OR pass through path string like `/api/admin/users?cursor=${cursor}&pageSize=${pageSize}`.
- The accessToken may be null (user not logged in). All admin API functions receive token
  from the caller; the query is disabled when token is null (enabled: !!accessToken).
- sonner: import { Toaster } from 'sonner'. Add <Toaster /> to AppProviders.tsx.
  DO NOT add toast calls in Phase 4 — just install and register the Toaster. Calls come in Phase 5+6.
</implementation>

<output>
Modify/Create these files:

frontend/horusvis-react/ (install command):
- `package.json` — updated by npm install

frontend/horusvis-react/src/:
- `app/AppProviders.tsx` — add QueryClientProvider + AuthStoreProvider + Toaster
- `stores/auth-store-context.ts` — AuthStoreContext type + context object
- `stores/auth-store.tsx` — AuthStoreProvider + useAuthStore hook
- `api/httpClient.ts` — add apiGetAuth, apiPostAuth, apiPutAuth, apiDeleteAuth
- `api/adminApi.ts` — NEW: all types + 11 API functions
- `app/RequireAdminRole.tsx` — NEW: route guard component
- `app/router.tsx` — wrap /admin with RequireAdminRole
- `components/admin/AdminSearchBar.tsx` — NEW: debounced search input
- `components/admin/AdminMetricsBar.tsx` — NEW: 3-card metrics bar
- `pages/AdminPage.tsx` — replace scaffold with real shell
</output>

<verification>
Before declaring complete:
1. Run: cd frontend/horusvis-react && npm run build
   → Must exit 0 with zero TypeScript errors
2. Confirm package.json contains @tanstack/react-query, react-hook-form, sonner in dependencies
3. Confirm apiGetAuth is exported from httpClient.ts
4. Confirm adminApi.ts exports all 11 functions and all type definitions
5. Confirm RequireAdminRole renders <Navigate to="/" replace /> when userRole !== 'admin'
6. Confirm AdminMetricsBar uses useQuery with enabled: !!accessToken guard
7. Confirm router.tsx wraps /admin inside RequireAdminRole layout route
</verification>

<summary_requirements>
Create `.prompts/013-admin-fe-shell-do/SUMMARY.md`

Template:
# Admin FE Shell — SUMMARY
**{one-liner}**

## Version
v1

## Key Findings
- {what was implemented}
- {package versions installed}
- {auth store pattern used}

## Files Created
- list all created/modified files

## Decisions Needed
{any open questions for user}

## Blockers
{build errors if any, or None}

## Next Step
Run Phase 5: `014-admin-user-directory-do.md`
</summary_requirements>

<success_criteria>
- npm install brings in @tanstack/react-query v5, react-hook-form v7, sonner
- QueryClientProvider wraps app in AppProviders
- AuthStoreProvider + useAuthStore hook working (context split pattern)
- Toaster registered in AppProviders
- httpClient.ts exports apiGetAuth + 3 sibling functions with Bearer header
- adminApi.ts: all types exported, 11 functions exported
- RequireAdminRole redirects non-admin to / (Navigate replace)
- router.tsx uses RequireAdminRole as layout route for /admin
- AdminSearchBar: debounce 300ms, controlled, no external deps
- AdminMetricsBar: useQuery with enabled guard, 3 cards, skeleton loading
- AdminPage shell renders without crashing; placeholder sections visible
- `npm run build` passes with 0 TS errors
- SUMMARY.md created at .prompts/013-admin-fe-shell-do/SUMMARY.md
</success_criteria>
