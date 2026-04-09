<objective>
Implement Projects Frontend Phase 3: create the TypeScript API client (projectsApi.ts), all TS
type definitions (projectsTypes.ts), a React context store for selected project state
(projectsStore), TanStack Query hooks (useProjects.ts), the replaced ProjectsPage list view, a
ProjectFilterBar component, and the /projects/:id route. Build must pass with 0 TS errors.

Purpose: Establishes the complete FE data and routing foundation for the Projects feature before
detail page components are built in Phase 4.
Output: 6 new files + 2 modified files; `npm run build` passes with 0 TS errors.
</objective>

<context>
Detailed phase plan (Phase 3):
@.prompts/009-projects-plan/projects-plan.md

Task specification:
@docs/outlines/tasks/02-projects/README.md

Current FE state (read before editing):
@frontend/horusvis-react/src/api/httpClient.ts
@frontend/horusvis-react/src/api/adminApi.ts
@frontend/horusvis-react/src/app/router.tsx
@frontend/horusvis-react/src/pages/ProjectsPage.tsx
@frontend/horusvis-react/src/stores/auth-store-context.ts
@frontend/horusvis-react/src/stores/auth-store.tsx
@frontend/horusvis-react/package.json
</context>

<requirements>

──────────────────────────────────────────────────────────
1. CREATE projectsTypes.ts — `frontend/horusvis-react/src/api/projectsTypes.ts`
──────────────────────────────────────────────────────────

Export all TypeScript interfaces mirroring the backend DTOs:

```typescript
export type ProjectListItem = {
  id: string; projectKey: string; projectName: string;
  status: string; ownerUserId: string; ownerDisplayName: string;
  startDate: string | null; endDate: string | null; memberCount: number;
};

export type ProjectListResponse = {
  items: ProjectListItem[]; totalCount: number; page: number; pageSize: number;
};

export type ProjectMemberDto = {
  id: string; userId: string; userDisplayName: string; userEmail: string;
  projectRole: string; memberStatus: string; joinedAt: string;
};

export type ProjectDetailResponse = {
  id: string; projectKey: string; projectName: string; description: string | null;
  status: string; ownerUserId: string; ownerDisplayName: string;
  startDate: string | null; endDate: string | null; createdAt: string;
  members: ProjectMemberDto[]; featureAreas: FeatureAreaDto[];
};

export type FeatureAreaDto = {
  id: string; areaCode: string; areaName: string;
  colorHex: string | null; sortOrder: number | null;
};

export type CreateProjectRequest = {
  projectKey: string; projectName: string;
  description?: string; startDate?: string; endDate?: string;
};

export type UpdateProjectRequest = {
  projectName?: string; description?: string;
  status?: string; startDate?: string; endDate?: string;
};

export type AddProjectMemberRequest = { userId: string; projectRole: string; };
export type UpdateProjectMemberRequest = { projectRole?: string; memberStatus?: string; };
export type CreateFeatureAreaRequest = {
  areaCode: string; areaName: string; colorHex?: string; sortOrder?: number;
};

// Overview types
export type MilestoneDto = { title: string; dueDate: string; } | null;
export type TeamWorkloadItem = { userId: string; displayName: string; taskCount: number; };
export type TaskSummaryDto = { todo: number; working: number; stuck: number; done: number; };
export type ProjectOverviewDto = {
  velocityScore: number;
  nextMilestone: MilestoneDto;
  teamWorkload: TeamWorkloadItem[];
  taskSummary: TaskSummaryDto;
};

// Board preview types
export type BoardTaskPreviewItem = {
  id: string; title: string; priority: string; assigneeUserId: string | null;
};
export type BoardColumnDto = {
  status: string; taskCount: number; tasks: BoardTaskPreviewItem[];
};
export type ProjectBoardPreviewDto = { columns: BoardColumnDto[]; };

// Filter
export type ProjectListFilter = {
  status?: string; ownerId?: string; page?: number; pageSize?: number;
};
```

──────────────────────────────────────────────────────────
2. CREATE projectsApi.ts — `frontend/horusvis-react/src/api/projectsApi.ts`
──────────────────────────────────────────────────────────

Import: `apiGetAuth`, `apiPostAuth`, `apiPutAuth`, `apiDeleteAuth` from `./httpClient`.
Import all types from `./projectsTypes`.

Export these functions (all accept `token: string`):

```typescript
getProjects(filter: ProjectListFilter, token: string): Promise<ProjectListResponse>
  → GET /api/projects  (build URLSearchParams from filter, omit undefined values)

getProjectById(id: string, token: string): Promise<ProjectDetailResponse>
  → GET /api/projects/{id}

createProject(req: CreateProjectRequest, token: string): Promise<ProjectDetailResponse>
  → POST /api/projects

updateProject(id: string, req: UpdateProjectRequest, token: string): Promise<ProjectDetailResponse>
  → PUT /api/projects/{id}

archiveProject(id: string, token: string): Promise<void>
  → DELETE /api/projects/{id}  (use apiDeleteAuth)

getProjectMembers(id: string, token: string): Promise<ProjectMemberDto[]>
  → GET /api/projects/{id}/members

addProjectMember(id: string, req: AddProjectMemberRequest, token: string): Promise<ProjectMemberDto>
  → POST /api/projects/{id}/members

updateProjectMember(id: string, memberId: string, req: UpdateProjectMemberRequest, token: string): Promise<ProjectMemberDto>
  → PUT /api/projects/{id}/members/{memberId}

removeProjectMember(id: string, memberId: string, token: string): Promise<void>
  → DELETE /api/projects/{id}/members/{memberId}

getFeatureAreas(id: string, token: string): Promise<FeatureAreaDto[]>
  → GET /api/projects/{id}/feature-areas

createFeatureArea(id: string, req: CreateFeatureAreaRequest, token: string): Promise<FeatureAreaDto>
  → POST /api/projects/{id}/feature-areas

getProjectOverview(id: string, token: string): Promise<ProjectOverviewDto>
  → GET /api/projects/{id}/overview

getBoardPreview(id: string, token: string): Promise<ProjectBoardPreviewDto>
  → GET /api/projects/{id}/board-preview
```

──────────────────────────────────────────────────────────
3. CREATE Projects Context Store — React context pattern (NOT Zustand)
──────────────────────────────────────────────────────────

IMPORTANT: The project uses React context for stores, NOT Zustand. Follow the exact split-file
pattern used by AppShellStore and AuthStore.

**`frontend/horusvis-react/src/stores/projects-store-context.ts`**:
```typescript
import { createContext, useContext } from "react";

export type ProjectsStoreValue = {
  selectedProjectId: string | null;
  filterStatus: string | null;
  filterOwnerId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  setFilterStatus: (status: string | null) => void;
  setFilterOwnerId: (ownerId: string | null) => void;
  resetFilters: () => void;
};

export const ProjectsStoreContext = createContext<ProjectsStoreValue | null>(null);

export function useProjectsStore() {
  const store = useContext(ProjectsStoreContext);
  if (store === null)
    throw new Error("useProjectsStore must be used within ProjectsStoreProvider.");
  return store;
}
```

**`frontend/horusvis-react/src/stores/projects-store.tsx`**:
- `ProjectsStoreProvider` holds state with `useState` for all 3 fields.
- Provides all 4 action functions.
- Wraps children with `ProjectsStoreContext.Provider`.
- Register `ProjectsStoreProvider` in `AppProviders.tsx` (inside the existing providers).

──────────────────────────────────────────────────────────
4. CREATE useProjects.ts — `frontend/horusvis-react/src/hooks/useProjects.ts`
──────────────────────────────────────────────────────────

Import: useAuthStore from `../stores/auth-store-context`.
Import: useProjectsStore from `../stores/projects-store-context`.
Import: all API functions from `../api/projectsApi`.

**Query hooks** (all: `enabled: !!accessToken`, staleTime as specified):

```typescript
export function useProjectList(filter?: ProjectListFilter)
  // staleTime: 5 * 60_000 | queryKey: ['projects', 'list', filter]

export function useProjectDetail(id: string | null)
  // staleTime: 2 * 60_000 | queryKey: ['projects', 'detail', id] | enabled: !!accessToken && !!id

export function useProjectOverview(id: string | null)
  // staleTime: 5 * 60_000 | queryKey: ['projects', 'overview', id] | enabled: !!accessToken && !!id

export function useBoardPreview(id: string | null)
  // staleTime: 2 * 60_000 | queryKey: ['projects', 'board', id] | enabled: !!accessToken && !!id

export function useProjectMembers(id: string | null)
  // staleTime: 5 * 60_000 | queryKey: ['projects', 'members', id] | enabled: !!accessToken && !!id

export function useFeatureAreas(id: string | null)
  // staleTime: 5 * 60_000 | queryKey: ['projects', 'feature-areas', id] | enabled: !!accessToken && !!id
```

**Mutation hooks** (all invalidate relevant query keys on success):

```typescript
export function useCreateProject()
  // onSuccess: invalidate ['projects', 'list']

export function useUpdateProject(id: string)
  // onSuccess: invalidate ['projects', 'detail', id] and ['projects', 'list']

export function useArchiveProject()
  // onSuccess: invalidate ['projects', 'list']

export function useAddMember(projectId: string)
  // onSuccess: invalidate ['projects', 'members', projectId] and ['projects', 'detail', projectId]

export function useUpdateMember(projectId: string)
  // onSuccess: same as useAddMember

export function useRemoveMember(projectId: string)
  // onSuccess: same as useAddMember

export function useCreateFeatureArea(projectId: string)
  // onSuccess: invalidate ['projects', 'feature-areas', projectId] and ['projects', 'detail', projectId]
```

──────────────────────────────────────────────────────────
5. REPLACE ProjectsPage.tsx
──────────────────────────────────────────────────────────

Replace `frontend/horusvis-react/src/pages/ProjectsPage.tsx` with a list view:

- Call `useProjectList(filter)` where filter comes from `useProjectsStore()`.
- Renders: page header with "Projects" title + "New Project" button (placeholder onClick for now).
- `<ProjectFilterBar />` below header.
- Project card grid/list: each card shows ProjectKey badge, ProjectName, Status chip, OwnerDisplayName, memberCount.
- Clicking a card navigates to `/projects/{item.id}` using `useNavigate()`.
- Loading state: show 4 skeleton placeholder divs.
- Error state: show "Failed to load projects."
- Empty state: show "No projects found." if items.length === 0.
- Pagination: show "Page X of Y" and Prev/Next buttons if totalCount > pageSize.
  - Pagination updates filter.page in projectsStore (or local state).

──────────────────────────────────────────────────────────
6. CREATE ProjectFilterBar.tsx
──────────────────────────────────────────────────────────

Create `frontend/horusvis-react/src/components/projects/ProjectFilterBar.tsx`:
- Two selects: Status (options: All / Draft / Active / OnHold / Archived) and a reset button.
- Reads/writes filterStatus from `useProjectsStore()`.
- On status change: call `setFilterStatus(value === "All" ? null : value)`.
- "Reset" button: calls `resetFilters()`.
- Inline flex row layout.

──────────────────────────────────────────────────────────
7. UPDATE router.tsx — Add /projects/:id route
──────────────────────────────────────────────────────────

Add a `/projects/:id` child route inside the AppShell children, pointing to a new
`ProjectDetailPage` import (create a stub page if the file does not exist yet):
```tsx
{ path: "/projects/:id", element: <ProjectDetailPage /> }
```

If `ProjectDetailPage.tsx` does not exist, create a minimal stub at
`frontend/horusvis-react/src/pages/ProjectDetailPage.tsx`:
```tsx
export default function ProjectDetailPage() {
  return <div>Project detail — Phase 4</div>;
}
```
This will be replaced in Phase 4.

──────────────────────────────────────────────────────────
8. CONSTRAINTS
──────────────────────────────────────────────────────────
- Do NOT install Zustand — use React context (as shown above).
- recharts is already installed — do NOT re-install.
- Do NOT add axios — use existing httpClient functions.
- TypeScript strict mode: no implicit any.
- All API functions must use auth-bearing httpClient functions (apiGetAuth etc.).
</requirements>

<output>
Files to create:
- frontend/horusvis-react/src/api/projectsTypes.ts
- frontend/horusvis-react/src/api/projectsApi.ts
- frontend/horusvis-react/src/stores/projects-store-context.ts
- frontend/horusvis-react/src/stores/projects-store.tsx
- frontend/horusvis-react/src/hooks/useProjects.ts
- frontend/horusvis-react/src/components/projects/ProjectFilterBar.tsx
- frontend/horusvis-react/src/pages/ProjectDetailPage.tsx (stub — replaced in 023)

Files to modify:
- frontend/horusvis-react/src/pages/ProjectsPage.tsx (full replacement)
- frontend/horusvis-react/src/app/router.tsx (/projects/:id route added)
- frontend/horusvis-react/src/app/AppProviders.tsx (ProjectsStoreProvider added)
</output>

<verification>
Before declaring complete:
1. Run: cd frontend/horusvis-react && npm run build
   → Must exit 0 with zero TypeScript errors
2. Confirm projectsApi.ts exports 13 functions
3. Confirm useProjects.ts exports 6 query hooks + 7 mutation hooks
4. Confirm stores use React context pattern (NOT Zustand) — NO "zustand" import anywhere
5. Confirm ProjectsStoreProvider is wrapped in AppProviders.tsx
6. Confirm /projects/:id route added to router.tsx
7. Confirm ProjectsPage no longer imports FeaturePage scaffold
8. Confirm ProjectFilterBar reads/writes from useProjectsStore()
</verification>

<summary_requirements>
Create `.prompts/022-projects-fe-api-do/SUMMARY.md`

Template:
# Projects FE API Layer — SUMMARY
**{one-liner}**

## Version
v1

## Key Findings
- {API functions created}
- {store pattern used}
- {hooks created}

## Files Created
- list all created/modified files

## Decisions Needed
- ProjectDetailPage is a stub — Phase 4 will replace it.

## Blockers
{build errors if any, or None}

## Next Step
Run Phase 4: `023-projects-fe-detail-do.md`
</summary_requirements>

<success_criteria>
- projectsTypes.ts: all DTO types exported
- projectsApi.ts: 13 API functions exported
- projects-store-context.ts + projects-store.tsx: React context (NOT Zustand)
- AppProviders.tsx: ProjectsStoreProvider added
- useProjects.ts: 6 query hooks + 7 mutation hooks; staleTime + enabled guards correct
- ProjectsPage.tsx: card list with navigate, loading/error/empty states, pagination
- ProjectFilterBar.tsx: status select + reset, wired to projectsStore
- router.tsx: /projects/:id route added
- ProjectDetailPage.tsx: minimal stub exists
- `npm run build` passes with 0 TS errors
- SUMMARY.md created at .prompts/022-projects-fe-api-do/SUMMARY.md
</success_criteria>
