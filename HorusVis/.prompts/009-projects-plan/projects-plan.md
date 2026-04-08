<?xml version="1.0" encoding="utf-8"?>
<plan>
  <summary>
    Implement the Projects workstream end-to-end: flesh out the backend service/controller layer over the
    already-migrated schema (Projects, ProjectMembers, FeatureAreas), then build the React frontend from
    the ProjectsPage shell through all four tabs (Overview, Board, Timeline stub, Files stub), team
    management drawer, feature-area management, and the NewProjectModal.
  </summary>

  <!-- ═══════════════════════════════════════════════════════════ PHASE 1 ═══ -->
  <phases>
    <phase number="1" name="Backend — Service + Controller (CRUD)">
      <objective>
        Wire up IProjectsService, IProjectMembersService, IFeatureAreasService with full CRUD methods,
        and expose them via ProjectsController. All endpoints require [Authorize].
        Owner-only writes are enforced via an inline user-id check in the service layer (no new policy needed
        for MVP — the service compares OwnerUserId against ClaimsPrincipal).
      </objective>
      <tasks>
        <!-- ─── Contracts ─────────────────────────────────────────────────── -->
        <task priority="high">
          Add IProjectMembersService and IFeatureAreasService interfaces to
          HorusVis.Business/Contracts/IProjectMembersService.cs and
          HorusVis.Business/Contracts/IFeatureAreasService.cs.
        </task>
        <task priority="high">
          Expand HorusVis.Business/Contracts/IProjectsService.cs with method signatures:
            Task&lt;ProjectListResponse&gt; GetProjectsAsync(ProjectListFilter filter, CancellationToken ct);
            Task&lt;ProjectDetailResponse&gt; GetProjectByIdAsync(Guid projectId, CancellationToken ct);
            Task&lt;ProjectDetailResponse&gt; CreateProjectAsync(CreateProjectRequest req, Guid ownerUserId, CancellationToken ct);
            Task&lt;ProjectDetailResponse&gt; UpdateProjectAsync(Guid projectId, UpdateProjectRequest req, Guid callerId, CancellationToken ct);
            Task ArchiveProjectAsync(Guid projectId, Guid callerId, CancellationToken ct);
        </task>

        <!-- ─── Request/Response models ───────────────────────────────────── -->
        <task priority="high">
          Create Web contract DTOs in HorusVis.Web/Contracts/Projects/:
            ProjectListResponse.cs   — { Items: ProjectListItem[], TotalCount: int, Page: int, PageSize: int }
            ProjectListItem.cs       — { Id, ProjectKey, ProjectName, Status, OwnerUserId, StartDate, EndDate, MemberCount }
            ProjectDetailResponse.cs — { Id, ProjectKey, ProjectName, Description, Status, OwnerUserId, StartDate, EndDate, CreatedAt, Members: ProjectMemberDto[], FeatureAreas: FeatureAreaDto[] }
            CreateProjectRequest.cs  — { ProjectKey, ProjectName, Description?, StartDate?, EndDate? }
            UpdateProjectRequest.cs  — { ProjectName?, Description?, Status?, StartDate?, EndDate? }
            ProjectListFilter.cs     — { Status?, OwnerId?, Page = 1, PageSize = 20 }

          Create in HorusVis.Web/Contracts/Members/:
            ProjectMemberDto.cs      — { Id, UserId, UserDisplayName, UserEmail, ProjectRole, MemberStatus, JoinedAt }
            AddProjectMemberRequest.cs — { UserId, ProjectRole }
            UpdateProjectMemberRequest.cs — { ProjectRole?, MemberStatus? }

          Create in HorusVis.Web/Contracts/FeatureAreas/:
            FeatureAreaDto.cs           — { Id, AreaCode, AreaName, ColorHex, SortOrder }
            CreateFeatureAreaRequest.cs — { AreaCode, AreaName, ColorHex?, SortOrder? }
        </task>

        <!-- ─── Service implementations ──────────────────────────────────── -->
        <task priority="high">
          Implement HorusVis.Business/Services/ProjectsService.cs.
          Inject HorusVisDbContext and IUnitOfWorkService.
          Use EF Core 10 direct DbContext queries (no separate DAO layer needed — existing pattern
          in AuthenticationService uses DbContext directly).
          Pagination: offset-based — .Skip((page-1)*pageSize).Take(pageSize).
          Include Members and FeatureAreas as navigations in detail query.
          Enforce owner-only writes: throw UnauthorizedAccessException if callerId != project.OwnerUserId.
        </task>
        <task priority="high">
          Implement HorusVis.Business/Services/ProjectMembersService.cs.
          Methods: GetMembersAsync, AddMemberAsync, UpdateMemberAsync, RemoveMemberAsync.
          Prevent adding duplicate (ProjectId, UserId) pairs (check existence before insert).
          Only project owner may add/update/remove members — same caller-id guard pattern.
        </task>
        <task priority="high">
          Implement HorusVis.Business/Services/FeatureAreasService.cs.
          Methods: GetFeatureAreasAsync, CreateFeatureAreaAsync, UpdateFeatureAreaAsync, DeleteFeatureAreaAsync.
          Scope-guard: FeatureArea must belong to the given projectId.
        </task>
        <task priority="medium">
          Register IProjectMembersService and IFeatureAreasService in
          HorusVis.Business/ServiceCollectionExtensions.cs (scoped).
        </task>

        <!-- ─── Controller ────────────────────────────────────────────────── -->
        <task priority="high">
          Replace the placeholder in HorusVis.Web/Controllers/ProjectsController.cs with full endpoints:
            GET    /api/projects                              → GetProjectsAsync
            POST   /api/projects                             → CreateProjectAsync
            GET    /api/projects/{projectId}                 → GetProjectByIdAsync
            PUT    /api/projects/{projectId}                 → UpdateProjectAsync
            DELETE /api/projects/{projectId}                 → ArchiveProjectAsync (sets Status = Archived)
            GET    /api/projects/{projectId}/members         → GetMembersAsync
            POST   /api/projects/{projectId}/members         → AddMemberAsync
            PUT    /api/projects/{projectId}/members/{memberId} → UpdateMemberAsync
            DELETE /api/projects/{projectId}/members/{memberId} → RemoveMemberAsync
            GET    /api/projects/{projectId}/feature-areas   → GetFeatureAreasAsync
            POST   /api/projects/{projectId}/feature-areas   → CreateFeatureAreaAsync
          Inject IProjectsService, IProjectMembersService, IFeatureAreasService.
          Extract callerId via User.FindFirstValue(ClaimTypes.NameIdentifier).
          Return 403 if service throws UnauthorizedAccessException.
          Return 404 if service throws KeyNotFoundException.
          Validate request bodies with [ApiController] model validation (DataAnnotations on DTOs).
        </task>
      </tasks>
      <deliverables>
        <deliverable>HorusVis.Web/Contracts/Projects/ProjectListResponse.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/Projects/ProjectListItem.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/Projects/ProjectDetailResponse.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/Projects/CreateProjectRequest.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/Projects/UpdateProjectRequest.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/Projects/ProjectListFilter.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/Members/ProjectMemberDto.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/Members/AddProjectMemberRequest.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/Members/UpdateProjectMemberRequest.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/FeatureAreas/FeatureAreaDto.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/FeatureAreas/CreateFeatureAreaRequest.cs</deliverable>
        <deliverable>HorusVis.Business/Contracts/IProjectMembersService.cs</deliverable>
        <deliverable>HorusVis.Business/Contracts/IFeatureAreasService.cs</deliverable>
        <deliverable>HorusVis.Business/Contracts/IProjectsService.cs (expanded)</deliverable>
        <deliverable>HorusVis.Business/Services/ProjectsService.cs (implemented)</deliverable>
        <deliverable>HorusVis.Business/Services/ProjectMembersService.cs</deliverable>
        <deliverable>HorusVis.Business/Services/FeatureAreasService.cs</deliverable>
        <deliverable>HorusVis.Web/Controllers/ProjectsController.cs (full endpoints)</deliverable>
        <deliverable>Backend builds; dotnet build passes; manual curl smoke-test of all 11 endpoints</deliverable>
      </deliverables>
      <dependencies>
        Database migration already applied (Projects, ProjectMembers, FeatureAreas, horusvis schema).
        IUnitOfWorkService and HorusVisDbContext DI already wired in HorusVis.Web/Program.cs.
        Bearer auth middleware already configured.
      </dependencies>
    </phase>

    <!-- ═══════════════════════════════════════════════════════════ PHASE 2 ═══ -->
    <phase number="2" name="Backend — Overview + Board Preview Queries">
      <objective>
        Add the two aggregation endpoints that power the FE Overview tab KPI cards and Board preview.
        Both are single-round-trip EF Core 10 projection queries — no new tables, no additional services.
      </objective>
      <tasks>
        <task priority="high">
          Expand IProjectsService with:
            Task&lt;ProjectOverviewDto&gt; GetProjectOverviewAsync(Guid projectId, CancellationToken ct);
            Task&lt;ProjectBoardPreviewDto&gt; GetBoardPreviewAsync(Guid projectId, CancellationToken ct);
        </task>
        <task priority="high">
          Implement GetProjectOverviewAsync in ProjectsService.cs using the EF Core 10 single-round-trip
          projection from the research notes:
            ProjectOverviewDto fields:
              decimal VelocityScore    — Tasks done in last 21 days / 3.0
              MilestoneDto? NextMilestone — earliest future milestone (due date + title; null if none)
              TeamWorkloadItem[] TeamWorkload — [{ UserId, DisplayName, TaskCount }]
              TaskSummaryDto TaskSummary    — { Todo, Working, Done }
          Note: Milestone entity may not exist in schema yet (see open questions).
          If Milestone table is absent, set NextMilestone = null and include a TODO comment.
        </task>
        <task priority="high">
          Implement GetBoardPreviewAsync in ProjectsService.cs:
            ProjectBoardPreviewDto fields:
              BoardColumnDto[] Columns — [{Status, TaskCount, Tasks: [{Id, Title, Priority, AssigneeUserId}] (top 5)}]
            Statuses: Todo, Working, Stuck, Done — mapped from WorkTask.Status enum.
        </task>
        <task priority="high">
          Create response DTOs in HorusVis.Web/Contracts/Projects/:
            ProjectOverviewDto.cs, MilestoneDto.cs, TeamWorkloadItem.cs, TaskSummaryDto.cs,
            ProjectBoardPreviewDto.cs, BoardColumnDto.cs, BoardTaskPreviewItem.cs.
        </task>
        <task priority="high">
          Add controller endpoints to ProjectsController:
            GET /api/projects/{projectId}/overview        → GetProjectOverviewAsync
            GET /api/projects/{projectId}/board-preview   → GetBoardPreviewAsync
        </task>
        <task priority="medium">
          Add integration-level unit tests in HorusVis.Business.Tests for overview query (in-memory SQLite
          or mock DbContext) covering: velocity calculation, empty milestone case, task distribution.
        </task>
      </tasks>
      <deliverables>
        <deliverable>HorusVis.Web/Contracts/Projects/ProjectOverviewDto.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/Projects/MilestoneDto.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/Projects/TeamWorkloadItem.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/Projects/TaskSummaryDto.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/Projects/ProjectBoardPreviewDto.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/Projects/BoardColumnDto.cs</deliverable>
        <deliverable>HorusVis.Web/Contracts/Projects/BoardTaskPreviewItem.cs</deliverable>
        <deliverable>GET /api/projects/{projectId}/overview responding with live data</deliverable>
        <deliverable>GET /api/projects/{projectId}/board-preview responding with live data</deliverable>
        <deliverable>Unit tests for overview calculation in HorusVis.Business.Tests</deliverable>
      </deliverables>
      <dependencies>Phase 1 complete (ProjectsController and ProjectsService exist).</dependencies>
    </phase>

    <!-- ═══════════════════════════════════════════════════════════ PHASE 3 ═══ -->
    <phase number="3" name="Frontend — API Layer + ProjectsPage Shell + Routing">
      <objective>
        Build the TypeScript API client, Zustand store, TanStack Query hooks, and the top-level
        ProjectsPage that lists projects and navigates to /projects/:id. No tab content yet.
      </objective>
      <tasks>
        <!-- ─── Types ─────────────────────────────────────────────────────── -->
        <task priority="high">
          Create frontend/horusvis-react/src/api/projectsApi.ts.
          Export typed functions over the existing httpClient:
            getProjects(filter): fetches GET /api/projects
            getProjectById(id): fetches GET /api/projects/{projectId}
            createProject(req): fetches POST /api/projects
            updateProject(id, req): fetches PUT /api/projects/{projectId}
            archiveProject(id): fetches DELETE /api/projects/{projectId}
            getProjectMembers(id): fetches GET /api/projects/{id}/members
            addProjectMember(id, req): fetches POST /api/projects/{id}/members
            updateProjectMember(id, memberId, req): fetches PUT /api/projects/{id}/members/{memberId}
            removeProjectMember(id, memberId): fetches DELETE /api/projects/{id}/members/{memberId}
            getFeatureAreas(id): fetches GET /api/projects/{id}/feature-areas
            createFeatureArea(id, req): fetches POST /api/projects/{id}/feature-areas
            getProjectOverview(id): fetches GET /api/projects/{id}/overview
            getBoardPreview(id): fetches GET /api/projects/{id}/board-preview
        </task>
        <task priority="high">
          Create frontend/horusvis-react/src/api/projectsTypes.ts with TypeScript interfaces mirroring
          all backend DTOs: ProjectListItem, ProjectDetailResponse, ProjectListResponse, CreateProjectRequest,
          UpdateProjectRequest, ProjectMemberDto, AddProjectMemberRequest, UpdateProjectMemberRequest,
          FeatureAreaDto, CreateFeatureAreaRequest, ProjectOverviewDto, MilestoneDto, TeamWorkloadItem,
          TaskSummaryDto, ProjectBoardPreviewDto, BoardColumnDto, BoardTaskPreviewItem.
        </task>

        <!-- ─── Zustand store ─────────────────────────────────────────────── -->
        <task priority="high">
          Create frontend/horusvis-react/src/stores/projectsStore.ts.
          State: selectedProjectId: string | null, filterStatus: string | null, filterOwnerId: string | null.
          Actions: setSelectedProject, setFilterStatus, setFilterOwnerId, resetFilters.
        </task>

        <!-- ─── TanStack Query hooks ──────────────────────────────────────── -->
        <task priority="high">
          Create frontend/horusvis-react/src/hooks/useProjects.ts.
          Exports: useProjectList(filter), useProjectDetail(id), useProjectOverview(id), useBoardPreview(id).
          staleTime: 5 * 60 * 1000 for list/overview; 2 * 60 * 1000 for detail.
          Also export mutation hooks: useCreateProject, useUpdateProject, useArchiveProject,
          useAddMember, useUpdateMember, useRemoveMember, useCreateFeatureArea.
          Each mutation invalidates ['projects'] and ['project', id] query keys on success.
        </task>

        <!-- ─── ProjectsPage (list view) ─────────────────────────────────── -->
        <task priority="high">
          Replace frontend/horusvis-react/src/pages/ProjectsPage.tsx with a real list view:
          - Shows project cards (ProjectKey badge, ProjectName, Status chip, Owner avatar, member count).
          - "New Project" button triggers NewProjectModal (Phase 5).
          - ProjectFilterBar for Status and Owner filters wired to projectsStore.
          - Clicking a card navigates to /projects/:id.
          - Pagination controls if TotalCount > 20.
          Use placeholder/loading skeletons while data loads (TanStack Query isPending).
        </task>

        <!-- ─── Routing ───────────────────────────────────────────────────── -->
        <task priority="high">
          Add /projects and /projects/:id routes.
          Locate the router definition (likely frontend/horusvis-react/src/app/ or App.tsx) and add
          the two routes pointing to ProjectsPage (list) and ProjectDetailPage (new shell, Phase 4).
        </task>

        <!-- ─── Components ────────────────────────────────────────────────── -->
        <task priority="high">
          Create frontend/horusvis-react/src/components/projects/ProjectFilterBar.tsx.
          Inputs: status select (Active / Archived / all), owner filter (dropdown populated from member list).
          Writes to projectsStore.
        </task>
      </tasks>
      <deliverables>
        <deliverable>frontend/horusvis-react/src/api/projectsApi.ts</deliverable>
        <deliverable>frontend/horusvis-react/src/api/projectsTypes.ts</deliverable>
        <deliverable>frontend/horusvis-react/src/stores/projectsStore.ts</deliverable>
        <deliverable>frontend/horusvis-react/src/hooks/useProjects.ts</deliverable>
        <deliverable>frontend/horusvis-react/src/pages/ProjectsPage.tsx (list view)</deliverable>
        <deliverable>frontend/horusvis-react/src/components/projects/ProjectFilterBar.tsx</deliverable>
        <deliverable>Route /projects and /projects/:id registered in router</deliverable>
        <deliverable>npm run build passes; no TypeScript errors</deliverable>
      </deliverables>
      <dependencies>
        Phase 1 backend deployed locally (or dev server running).
        @tanstack/react-query already installed (confirm in package.json; install if absent).
        zustand already installed (confirm; install if absent).
      </dependencies>
    </phase>

    <!-- ═══════════════════════════════════════════════════════════ PHASE 4 ═══ -->
    <phase number="4" name="Frontend — ProjectDetailPage: Header + Tabs + Overview Tab">
      <objective>
        Build the project detail shell — ProjectHeader, ProjectTabs, and the fully implemented
        Overview tab with four Recharts-powered KPI cards. Timeline and Files tabs are rendered as
        stubs. Board tab is a stub here; filled in Phase 5.
      </objective>
      <tasks>
        <!-- ─── Detail page shell ─────────────────────────────────────────── -->
        <task priority="high">
          Create frontend/horusvis-react/src/pages/ProjectDetailPage.tsx.
          Reads :id from useParams, calls useProjectDetail(id) and sets selectedProjectId in projectsStore.
          Renders ProjectHeader + ProjectTabs.
          Handles loading/error states.
        </task>
        <task priority="high">
          Create frontend/horusvis-react/src/components/projects/ProjectHeader.tsx.
          Props: project: ProjectDetailResponse.
          Shows: ProjectKey badge (colored), ProjectName (h1), Status chip, Owner avatar + name,
          ProjectMemberAvatarGroup (max 5 + overflow), Edit button (owner only — compare with auth user).
          Deep-link buttons: "My Tasks" → /tasks?projectId={id}, "Reports" → /reports?projectId={id}.
        </task>
        <task priority="high">
          Create frontend/horusvis-react/src/components/projects/ProjectTabs.tsx.
          Tab items: Overview | Board | Timeline | Files.
          Uses URL hash or React state for active tab.
          Renders child per tab:
            Overview → ProjectOverviewCards
            Board    → ProjectBoardPreview (Phase 5)
            Timeline → &lt;FeaturePage title="Timeline" description="Coming soon" /&gt; stub
            Files    → &lt;FeaturePage title="Files" description="Coming soon" /&gt; stub
        </task>

        <!-- ─── Overview tab ─────────────────────────────────────────────── -->
        <task priority="high">
          Create frontend/horusvis-react/src/components/projects/ProjectOverviewCards.tsx.
          Calls useProjectOverview(projectId). Renders four KPI cards in a 2×2 grid.
        </task>
        <task priority="high">
          Create frontend/horusvis-react/src/components/projects/VelocityScoreCard.tsx.
          Displays VelocityScore as a large number with a label "tasks/week (last 3 weeks)".
          Uses Recharts LineChart sparkline (last 3 weeks' done counts from TaskSummary if available;
          fall back to static single-point display if only summary data is returned).
        </task>
        <task priority="high">
          Create frontend/horusvis-react/src/components/projects/CriticalDatesCard.tsx.
          Displays NextMilestone.Title and a countdown (days until DueDate using date-fns or built-in).
          Shows "No upcoming milestones" if NextMilestone is null.
        </task>
        <task priority="high">
          Create frontend/horusvis-react/src/components/projects/TeamAvailabilityCard.tsx.
          Renders TeamWorkload as a horizontal Recharts BarChart (member name on Y axis, task count on X).
          Uses ResponsiveContainer for fluid width.
        </task>
        <task priority="high">
          Create frontend/horusvis-react/src/components/projects/ProjectBoardPreviewCard.tsx
          (the KPI card version — not the full board).
          Renders a Recharts PieChart with Todo / Working / Done slices from TaskSummary.
          Colors: Todo=#94a3b8, Working=#3b82f6, Done=#22c55e.
          Shows total task count in center using a Recharts label.
        </task>

        <!-- ─── Member avatars ────────────────────────────────────────────── -->
        <task priority="high">
          Create frontend/horusvis-react/src/components/projects/ProjectMemberAvatarGroup.tsx.
          Shows up to 5 avatar circles (initials fallback), then "+N" overflow badge.
          Clicking opens EditMemberDrawer (Phase 5).
        </task>

        <!-- ─── Dependencies ─────────────────────────────────────────────── -->
        <task priority="medium">
          Confirm recharts is installed (package.json); if not, add it with npm install recharts.
          Confirm date-fns is installed; if not, add it.
        </task>
      </tasks>
      <deliverables>
        <deliverable>frontend/horusvis-react/src/pages/ProjectDetailPage.tsx</deliverable>
        <deliverable>frontend/horusvis-react/src/components/projects/ProjectHeader.tsx</deliverable>
        <deliverable>frontend/horusvis-react/src/components/projects/ProjectTabs.tsx</deliverable>
        <deliverable>frontend/horusvis-react/src/components/projects/ProjectOverviewCards.tsx</deliverable>
        <deliverable>frontend/horusvis-react/src/components/projects/VelocityScoreCard.tsx</deliverable>
        <deliverable>frontend/horusvis-react/src/components/projects/CriticalDatesCard.tsx</deliverable>
        <deliverable>frontend/horusvis-react/src/components/projects/TeamAvailabilityCard.tsx</deliverable>
        <deliverable>frontend/horusvis-react/src/components/projects/ProjectBoardPreviewCard.tsx</deliverable>
        <deliverable>frontend/horusvis-react/src/components/projects/ProjectMemberAvatarGroup.tsx</deliverable>
        <deliverable>Overview tab shows live KPI data from /api/projects/{id}/overview</deliverable>
        <deliverable>npm run build passes; no TypeScript errors</deliverable>
      </deliverables>
      <dependencies>Phase 2 (overview endpoint) and Phase 3 (hooks, store, routing) complete.</dependencies>
    </phase>

    <!-- ═══════════════════════════════════════════════════════════ PHASE 5 ═══ -->
    <phase number="5" name="Frontend — Board Tab + Member Drawer + Feature Area Management">
      <objective>
        Fill in the Board tab with a read-only Kanban preview, build the EditMemberDrawer for team
        management, and build FeatureAreaList with inline creation. NewProjectModal also lands here.
      </objective>
      <tasks>
        <!-- ─── Board Preview tab ─────────────────────────────────────────── -->
        <task priority="high">
          Create frontend/horusvis-react/src/components/projects/ProjectBoardPreview.tsx.
          Full Board tab content (NOT drag-and-drop — that is task 03 scope).
          Calls useBoardPreview(projectId). Renders 4 columns: Todo | Working | Stuck | Done.
          Each column: column header with task count badge, list of up to 5 task preview cards
          (title, priority dot, assignee avatar). "View all" link navigates to /tasks?projectId={id}&status={status}.
          No reordering in this phase.
        </task>

        <!-- ─── FeatureArea management ──────────────────────────────────────── -->
        <task priority="high">
          Create frontend/horusvis-react/src/components/projects/FeatureAreaList.tsx.
          Shows existing feature areas as colored badge pills (AreaName, ColorHex background).
          "+ Add Feature Area" button opens an inline form row (AreaName input, color picker, Save).
          Uses useCreateFeatureArea mutation.
          Only visible to project owner (compare auth user with project.OwnerUserId).
        </task>

        <!-- ─── Edit member drawer ─────────────────────────────────────────── -->
        <task priority="high">
          Create frontend/horusvis-react/src/components/projects/EditMemberDrawer.tsx.
          Opens as a side drawer (Radix UI Dialog or native HTML details — match existing UI primitives).
          React Hook Form v7 with Controller wrapping:
            - Role selector: Owner | Member | Viewer (maps to ProjectRole string)
            - MemberStatus selector: Active | Inactive
          Save button calls useUpdateMember mutation.
          Remove button (owner only) calls useRemoveMember mutation with confirm dialog.
          "Add member" flow: email/user search input at top of drawer → useAddMember mutation.
        </task>

        <!-- ─── NewProjectModal ────────────────────────────────────────────── -->
        <task priority="high">
          Create frontend/horusvis-react/src/components/projects/NewProjectModal.tsx.
          Dialog/modal (Radix UI Dialog or existing modal pattern in the codebase).
          React Hook Form v7 fields: ProjectName (required), ProjectKey (required, max 20, auto-suggest
          from name), Description (optional), StartDate (optional), EndDate (optional).
          Validation: ProjectKey uppercase-only alphanumeric pattern (/^[A-Z0-9]{2,20}$/).
          Submit calls useCreateProject, on success closes modal and navigates to /projects/{newId}.
        </task>

        <!-- ─── NewProjectButton ───────────────────────────────────────────── -->
        <task priority="medium">
          Create frontend/horusvis-react/src/components/projects/NewProjectButton.tsx.
          Simple button that opens NewProjectModal state. Used in ProjectsPage.
        </task>
      </tasks>
      <deliverables>
        <deliverable>frontend/horusvis-react/src/components/projects/ProjectBoardPreview.tsx</deliverable>
        <deliverable>frontend/horusvis-react/src/components/projects/FeatureAreaList.tsx</deliverable>
        <deliverable>frontend/horusvis-react/src/components/projects/EditMemberDrawer.tsx</deliverable>
        <deliverable>frontend/horusvis-react/src/components/projects/NewProjectModal.tsx</deliverable>
        <deliverable>frontend/horusvis-react/src/components/projects/NewProjectButton.tsx</deliverable>
        <deliverable>Board tab renders read-only preview of task distribution</deliverable>
        <deliverable>Members are manageable via EditMemberDrawer (add/update role/remove)</deliverable>
        <deliverable>Feature areas are viewable and new ones can be created</deliverable>
        <deliverable>New project can be created and navigated to</deliverable>
        <deliverable>npm run build passes; no TypeScript errors</deliverable>
      </deliverables>
      <dependencies>
        Phase 3 and 4 complete.
        react-hook-form v7 installed (confirm; install if absent).
        Radix UI Dialog or existing modal primitive available in codebase.
      </dependencies>
    </phase>
  </phases>

  <!-- ═══════════════════════════════════════════════════════════ METADATA ═══ -->
  <metadata>
    <confidence level="high">
      Schema is fully migrated. Existing scaffold wiring (controllers, services, DI) is consistent.
      All library choices are confirmed from research. The only gap is the Milestone entity (see open questions).
    </confidence>

    <dependencies>
      <dep>Phase 1 must complete before Phase 2 (controller exists) and before Phase 3 (API contract shapes known).</dep>
      <dep>Phase 2 must complete before Phase 4 (overview endpoint needed for KPI cards).</dep>
      <dep>Phase 3 must complete before Phase 4 and 5 (hooks and store needed).</dep>
      <dep>Phase 4 must complete before Phase 5 (ProjectTabs shell needed for Board tab slot).</dep>
    </dependencies>

    <open_questions>
      <question id="Q1" priority="high">
        Is there a Milestone entity in the database schema? The migration snapshot does not show a
        Milestones table. If absent, CriticalDatesCard will always show "No upcoming milestones" until
        the Milestone table is added in a future migration. Decision needed before Phase 2.
      </question>
      <question id="Q2" priority="medium">
        What UI component library is in use for dialogs/drawers? The existing codebase has only
        MainLayout.tsx and FeaturePage.tsx — no Radix UI or shadcn/ui imports visible. The Do prompt
        for Phase 5 should confirm the modal primitive (or install Radix UI Dialog if absent).
      </question>
      <question id="Q3" priority="medium">
        Should FeatureArea deletion (DELETE /api/projects/{id}/feature-areas/{areaId}) be in scope
        for this workstream? The task spec only lists POST for feature areas. Include a low-priority
        delete endpoint in Phase 1 or defer to a follow-up?
      </question>
      <question id="Q4" priority="low">
        Pagination strategy for members list: offset (simple) or keyset? Members per project are
        expected to be &lt; 50 so offset pagination (or no pagination) is fine for MVP.
      </question>
    </open_questions>

    <assumptions>
      <assumption>ProjectStatus enum values are Active and Archived (from migration; confirm in HorusVis.Data/Enums/).</assumption>
      <assumption>MemberStatus enum values are Active and Inactive (from ProjectMember entity).</assumption>
      <assumption>WorkTask.Status enum has Todo, Working, Stuck, Done (from research notes and KanbanBoard decomposition).</assumption>
      <assumption>httpClient.ts in frontend/horusvis-react/src/api/ already handles Authorization header injection.</assumption>
      <assumption>@tanstack/react-query QueryClient is already configured in App.tsx or main.tsx.</assumption>
      <assumption>react-hook-form v7 is the only forms library to be used — no other form library will be introduced.</assumption>
      <assumption>Recharts v3 (tree-shakeable import) — only import used chart types to keep bundle small.</assumption>
    </assumptions>
  </metadata>
</plan>
