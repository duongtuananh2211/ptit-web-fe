<objective>
Implement Projects Frontend Phase 5: replace the Board tab stub with a read-only Kanban preview,
build EditMemberDrawer (React Hook Form v7, native HTML dialog), FeatureAreaList with inline
creation, NewProjectModal (native dialog), and NewProjectButton. Build must pass with 0 TS errors.

Purpose: Completes the Projects feature — the Board tab shows task distribution, team membership
is manageable, feature areas are viewable and creatable, and new projects can be created.
Output: 5 new component files + 2 modified files; `npm run build` passes with 0 TS errors.
</objective>

<context>
Detailed phase plan (Phase 5):
@.prompts/009-projects-plan/projects-plan.md

Task specification:
@docs/outlines/tasks/02-projects/README.md

Reference UI screenshot:
@docs/outlines/stitch_horusvis/dashboard_compact_view_v3/screen.png

Hooks and types from Phase 3:
@frontend/horusvis-react/src/hooks/useProjects.ts
@frontend/horusvis-react/src/api/projectsTypes.ts
@frontend/horusvis-react/src/stores/projects-store-context.ts

Auth store (for owner-only logic):
@frontend/horusvis-react/src/stores/auth-store-context.ts

Phase 4 components (read header before editing tabs):
@frontend/horusvis-react/src/components/projects/ProjectTabs.tsx
@frontend/horusvis-react/src/components/projects/ProjectMemberAvatarGroup.tsx

package.json (confirm react-hook-form v7 is present):
@frontend/horusvis-react/package.json
</context>

<requirements>

──────────────────────────────────────────────────────────
1. CREATE ProjectBoardPreview.tsx (full Board tab — NOT the KPI card)
──────────────────────────────────────────────────────────

`frontend/horusvis-react/src/components/projects/ProjectBoardPreview.tsx`
Props: `projectId: string`

- Calls `useBoardPreview(projectId)`.
- isLoading: 4 skeleton columns.
- isError: "Failed to load board preview."
- Renders 4 columns in a flex row: the `columns` array from the API response.
  Each column:
    - Header: Status label + task count badge (e.g. "Working  3").
    - List of up to 5 task preview cards. Each card shows:
        - Priority dot (Critical=red, High=orange, Medium=amber, Low=grey).
        - Title (truncated to 50 chars).
        - Empty assignee circle if assigneeUserId is null, else initials circle.
    - "View all →" link: navigates to `/my-tasks?projectId={projectId}&status={column.status}`.
      Use `useNavigate()` from react-router-dom.
- Read-only — NO drag-and-drop.

──────────────────────────────────────────────────────────
2. CREATE FeatureAreaList.tsx
──────────────────────────────────────────────────────────

`frontend/horusvis-react/src/components/projects/FeatureAreaList.tsx`
Props: `projectId: string; ownerId: string`

- Calls `useFeatureAreas(projectId)` and `useCreateFeatureArea(projectId)`.
- Auth check: reads `accessToken` from `useAuthStore()`  — BUT for owner-only visibility,
  compare `ownerId` prop with a decoded user ID from the JWT stored in auth store.
  Simpler approach: accept an `isOwner: boolean` prop from the parent (ProjectDetailPage
  or ProjectHeader computes `project.ownerUserId === decodedUserId`).
  Use `isOwner` prop instead of decoding JWT in this component.

  **REVISED Props**: `projectId: string; isOwner: boolean`

- Renders existing feature areas as coloured badge pills:
    - Background: `item.colorHex ?? "#6366f1"`.
    - Text: `item.AreaName` (white text).
    - Flex wrap row.

- Add form (only if `isOwner`):
    - Local state: showForm (boolean), areaCode (string), areaName (string), colorHex (string, default "#6366f1").
    - "+ Add Feature Area" button toggles showForm.
    - If showForm: render inline row with 3 inputs (AreaCode, AreaName, ColorHex input type="color") + Save + Cancel.
    - Save: calls `createFeatureAreaMutation.mutate({ areaCode, areaName, colorHex })`.
    - On success: reset form state.
    - Validation: areaCode and areaName must not be empty before Save is enabled.

──────────────────────────────────────────────────────────
3. CREATE EditMemberDrawer.tsx
──────────────────────────────────────────────────────────

`frontend/horusvis-react/src/components/projects/EditMemberDrawer.tsx`

Implementation: Use native HTML `<dialog>` element (no Radix UI required — no UI lib is installed).

Props:
```typescript
{
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
}
```

Internal:
- Calls `useProjectMembers(projectId)`.
- Calls `useAddMember(projectId)`, `useUpdateMember(projectId)`, `useRemoveMember(projectId)`.

Layout (inside dialog):
- Title: "Manage Members".
- Close button (×) calls `onClose()`.
- "Add member" section (only if `isOwner`):
    - React Hook Form v7 with `useForm<{ userId: string; projectRole: string }>()`.
    - Fields: UserId text input (GUID or email — send as userId), Role select (Owner / Member / Viewer).
    - Submit: calls `addMemberMutation.mutate({ userId, projectRole })`.
- Member list section:
    - For each member: avatar (initials), displayName, email, role badge, status badge.
    - If `isOwner`: inline role selector + "Remove" button per member.
      - Role change: calls `updateMemberMutation.mutate({ memberId, { projectRole: newRole } })`.
      - Remove: calls `removeMemberMutation.mutate({ memberId })`.
        Add a simple `confirm("Remove this member?")` before removing.

Dialog behaviour:
- Use `useEffect` to call `dialogRef.current?.showModal()` when `isOpen` becomes true.
- Call `dialogRef.current?.close()` + `onClose()` when ×  is clicked or dialog `cancel` event fires.

──────────────────────────────────────────────────────────
4. CREATE NewProjectModal.tsx
──────────────────────────────────────────────────────────

`frontend/horusvis-react/src/components/projects/NewProjectModal.tsx`

Props: `{ isOpen: boolean; onClose: () => void }`

Implementation: Use native HTML `<dialog>` element.

React Hook Form v7:
```typescript
type FormValues = {
  projectKey: string;
  projectName: string;
  description: string;
  startDate: string;
  endDate: string;
};
```

Fields:
- ProjectName (required, max 150).
- ProjectKey (required, max 20, pattern /^[A-Z0-9]{2,20}$/, auto-suggests uppercase from
  ProjectName: sync with `watch("projectName")` → uppercase first word, max 6 chars, stripped of spaces).
- Description (optional, textarea).
- StartDate (optional, `input type="date"`).
- EndDate (optional, `input type="date"`).

Behaviour:
- Submit: calls `useCreateProject().mutate(formValues)`.
- On success: close modal, navigate to `/projects/{newProject.id}`.
- On error: show error message from mutation's `error.message`.
- Validation errors shown inline under each field.

──────────────────────────────────────────────────────────
5. CREATE NewProjectButton.tsx
──────────────────────────────────────────────────────────

`frontend/horusvis-react/src/components/projects/NewProjectButton.tsx`

- Local state: `isModalOpen`.
- Renders: `<button>+ New Project</button>` that sets `isModalOpen = true`.
- Renders: `<NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />`.

──────────────────────────────────────────────────────────
6. UPDATE ProjectTabs.tsx — Wire Board tab
──────────────────────────────────────────────────────────

Replace the Board tab placeholder `<div>Board tab — Phase 5</div>` with:
```tsx
<ProjectBoardPreview projectId={projectId} />
```
Import ProjectBoardPreview from `./ProjectBoardPreview`.

──────────────────────────────────────────────────────────
7. UPDATE ProjectsPage.tsx — Wire NewProjectButton
──────────────────────────────────────────────────────────

Replace the inline "New Project" button placeholder with `<NewProjectButton />`.
Import NewProjectButton from `../components/projects/NewProjectButton`.

──────────────────────────────────────────────────────────
8. Wire EditMemberDrawer into ProjectMemberAvatarGroup or ProjectHeader
──────────────────────────────────────────────────────────

Update `ProjectMemberAvatarGroup.tsx` from Phase 4 to open EditMemberDrawer when clicked:
- Add props: `projectId: string; isOwner: boolean`.
- Local state: `isDrawerOpen`.
- Clicking the avatar group sets `isDrawerOpen = true`.
- Render: `<EditMemberDrawer projectId={projectId} isOpen={isDrawerOpen} onClose={...} isOwner={isOwner} />`.

Update `ProjectHeader.tsx` from Phase 4 to:
- Determine `isOwner`: compare `project.ownerUserId` with `useAuthStore().accessToken` decoded user id.
  Simplest approach: compare `project.ownerUserId` against a userId exposed by the auth store.
  If auth store does not expose userId directly, parse it from the JWT `sub` claim using:
  `JSON.parse(atob(token.split('.')[1])).sub`.
- Pass `projectId={project.id}` and `isOwner={isOwner}` to `ProjectMemberAvatarGroup`.
- Pass `projectId={project.id}` and `isOwner={isOwner}` to `FeatureAreaList`.
- Render `<FeatureAreaList projectId={project.id} isOwner={isOwner} />` below the header row.

──────────────────────────────────────────────────────────
9. CONSTRAINTS
──────────────────────────────────────────────────────────
- Use native HTML `<dialog>` element — no Radix UI, no custom modal library.
- React Hook Form v7 is already installed — use `useForm`, `register`, `handleSubmit`, `watch`.
- No new npm packages.
- TypeScript strict mode; no implicit any.
- `confirm()` is acceptable for the remove-member confirmation (no custom dialog needed).
</requirements>

<output>
Files to create:
- frontend/horusvis-react/src/components/projects/ProjectBoardPreview.tsx
- frontend/horusvis-react/src/components/projects/FeatureAreaList.tsx
- frontend/horusvis-react/src/components/projects/EditMemberDrawer.tsx
- frontend/horusvis-react/src/components/projects/NewProjectModal.tsx
- frontend/horusvis-react/src/components/projects/NewProjectButton.tsx

Files to modify:
- frontend/horusvis-react/src/components/projects/ProjectTabs.tsx (Board tab wired)
- frontend/horusvis-react/src/components/projects/ProjectMemberAvatarGroup.tsx (drawer added)
- frontend/horusvis-react/src/components/projects/ProjectHeader.tsx (FeatureAreaList + isOwner)
- frontend/horusvis-react/src/pages/ProjectsPage.tsx (NewProjectButton wired)
</output>

<verification>
Before declaring complete:
1. Run: cd frontend/horusvis-react && npm run build
   → Must exit 0 with zero TypeScript errors
2. Confirm ProjectBoardPreview renders 4 columns with task preview cards
3. Confirm FeatureAreaList uses `isOwner` prop (not JWT decoding internally)
4. Confirm EditMemberDrawer uses native `<dialog>` (not Radix)
5. Confirm NewProjectModal uses React Hook Form v7 with ProjectKey auto-suggest
6. Confirm NewProjectModal validates ProjectKey with /^[A-Z0-9]{2,20}$/
7. Confirm ProjectTabs Board tab now renders ProjectBoardPreview (not placeholder)
8. Confirm ProjectMemberAvatarGroup opens EditMemberDrawer on click
9. Confirm no new npm packages were installed
</verification>

<summary_requirements>
Create `.prompts/024-projects-fe-board-do/SUMMARY.md`

Template:
# Projects FE Board + Modals — SUMMARY
**{one-liner}**

## Version
v1

## Key Findings
- {components built}
- {dialog implementation strategy}
- {form approach}

## Files Created
- list all created/modified files

## Decisions Needed
- Authenticated userId comparison: JWT `sub` claim is parsed from accessToken.
  If auth store exposes userId separately in a future refactor, update ProjectHeader.

## Blockers
{build errors if any, or None}

## Next Step
Manual smoke test: log in, open Projects page, create project, add member, view board preview.
</summary_requirements>

<success_criteria>
- ProjectBoardPreview: 4 columns, task cards with priority dot + title, "View all" link
- FeatureAreaList: coloured badges + owner-gated inline add form
- EditMemberDrawer: native dialog, RHF add-member form, list with role/remove controls
- NewProjectModal: native dialog, RHF form, ProjectKey auto-suggest + regex validation
- NewProjectButton: controls modal open state
- ProjectTabs Board tab: renders ProjectBoardPreview (not placeholder)
- ProjectMemberAvatarGroup: opens EditMemberDrawer on click
- ProjectHeader: computes isOwner from JWT, renders FeatureAreaList
- ProjectsPage: uses NewProjectButton
- `npm run build` passes with 0 TS errors
- SUMMARY.md created at .prompts/024-projects-fe-board-do/SUMMARY.md
</success_criteria>
