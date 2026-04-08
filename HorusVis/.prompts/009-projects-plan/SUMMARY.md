# SUMMARY — 009 Projects Plan

## One-Liner

Implement the Projects workstream in 5 ordered phases: backend CRUD + authorization → aggregation queries → FE API/store/routing → ProjectDetailPage + Overview KPI cards → Board tab + member drawer + FeatureArea management + NewProjectModal.

---

## Phase Breakdown

| # | Name | Key Deliverable |
|---|------|-----------------|
| 1 | Backend — Service + Controller (CRUD) | All 11 REST endpoints live; ProjectsService, ProjectMembersService, FeatureAreasService implemented |
| 2 | Backend — Overview + Board Preview Queries | `GET /api/projects/{id}/overview` and `/board-preview` returning aggregated live data |
| 3 | Frontend — API Layer + ProjectsPage Shell + Routing | projectsApi.ts, projectsTypes.ts, Zustand store, TanStack Query hooks, project list page, routing |
| 4 | Frontend — ProjectDetailPage: Header + Tabs + Overview Tab | ProjectHeader, ProjectTabs, 4 Recharts KPI cards wired to overview endpoint |
| 5 | Frontend — Board Tab + Member Drawer + Feature Area Management | Read-only Kanban preview, EditMemberDrawer (React Hook Form v7), FeatureAreaList, NewProjectModal |

---

## Decisions Needed

| ID | Priority | Question |
|----|----------|----------|
| Q1 | **High** | Does a `Milestones` table exist in the DB schema? Not found in the migration snapshot. If absent, add a migration or accept that CriticalDatesCard will always show "No upcoming milestones" until a future sprint. Must be decided before Phase 2. |
| Q2 | **Medium** | Which dialog/modal primitive does the FE use? No Radix UI or shadcn imports found in the existing components. Phase 5 Do prompt must either confirm an existing primitive or install `@radix-ui/react-dialog`. |
| Q3 | **Medium** | Should `DELETE /api/projects/{id}/feature-areas/{areaId}` be in Phase 1 scope? The task spec only lists POST. Low-risk to add it; confirm before Phase 1 Do prompt. |
| Q4 | **Low** | Member list pagination: offset or keyset? Members per project expected < 50 — offset (or no pagination) is fine for MVP. |

---

## Blockers

None currently. The database migration is applied, scaffold wiring exists for all services and controllers, and library choices are confirmed from research.

---

## Next Step

Run the **Phase 1 Do prompt**: implement the backend service layer (ProjectsService, ProjectMembersService, FeatureAreasService), request/response DTOs, and all 11 controller endpoints in ProjectsController.

**Before starting Phase 1**, answer Q1 (Milestones table) and Q3 (FeatureArea delete endpoint scope).
