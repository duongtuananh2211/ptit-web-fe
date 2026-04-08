<objective>
Implement Projects Backend Phase 1: define all request/response DTOs, create service interfaces
(IProjectsService, IProjectMembersService, IFeatureAreasService), implement all three services
with EF Core queries, and wire all 13 REST endpoints in ProjectsController (including FeatureArea delete).

Purpose: Establishes the complete Projects backend — CRUD for projects, members, and feature areas —
with owner-only write authorization enforced at the service layer.
Output: ~25 new/modified C# files; `dotnet build HorusVis.sln` passes with 0 errors.
</objective>

<context>
Detailed phase plan (Phase 1):
@.prompts/009-projects-plan/projects-plan.md

Task specification and API contract:
@docs/outlines/tasks/02-projects/README.md

Current empty scaffolds (read before editing):
@backend/src/HorusVis.Business/Contracts/IProjectsService.cs
@backend/src/HorusVis.Business/Services/ProjectsService.cs
@backend/src/HorusVis.Web/Controllers/ProjectsController.cs
@backend/src/HorusVis.Business/ServiceCollectionExtensions.cs

Entity definitions (understand fields before writing DTOs):
@backend/src/HorusVis.Data/Horusvis/Entities/Project.cs
@backend/src/HorusVis.Data/Horusvis/Entities/ProjectMember.cs
@backend/src/HorusVis.Data/Horusvis/Entities/FeatureArea.cs
@backend/src/HorusVis.Data/Horusvis/Entities/User.cs

Reference service for DI/DbContext injection pattern:
@backend/src/HorusVis.Business/Services/ReportsService.cs

Reference controller for style/pattern:
@backend/src/HorusVis.Web/Controllers/ReportsController.cs
</context>

<requirements>

──────────────────────────────────────────────────────────
PART A — RESPONSE DTOs (in HorusVis.Business/Models/Projects/)
──────────────────────────────────────────────────────────

1. Create `backend/src/HorusVis.Business/Models/Projects/` directory with these records,
   all under namespace `HorusVis.Business.Models.Projects`:

   **ProjectListItem.cs**
   ```csharp
   public sealed record ProjectListItem(
       Guid    Id,
       string  ProjectKey,
       string  ProjectName,
       string  Status,
       Guid    OwnerUserId,
       string  OwnerDisplayName,
       DateOnly? StartDate,
       DateOnly? EndDate,
       int     MemberCount
   );
   ```

   **ProjectListResponse.cs**
   ```csharp
   public sealed record ProjectListResponse(
       IReadOnlyList<ProjectListItem> Items,
       int TotalCount,
       int Page,
       int PageSize
   );
   ```

   **ProjectMemberDto.cs**
   ```csharp
   public sealed record ProjectMemberDto(
       Guid   Id,
       Guid   UserId,
       string UserDisplayName,
       string UserEmail,
       string ProjectRole,
       string MemberStatus,
       DateTimeOffset JoinedAt
   );
   ```

   **ProjectDetailResponse.cs**
   ```csharp
   public sealed record ProjectDetailResponse(
       Guid    Id,
       string  ProjectKey,
       string  ProjectName,
       string? Description,
       string  Status,
       Guid    OwnerUserId,
       string  OwnerDisplayName,
       DateOnly? StartDate,
       DateOnly? EndDate,
       DateTimeOffset CreatedAt,
       IReadOnlyList<ProjectMemberDto>  Members,
       IReadOnlyList<FeatureAreaDto>    FeatureAreas
   );
   ```

   **FeatureAreaDto.cs**
   ```csharp
   public sealed record FeatureAreaDto(
       Guid    Id,
       string  AreaCode,
       string  AreaName,
       string? ColorHex,
       int?    SortOrder
   );
   ```

──────────────────────────────────────────────────────────
PART B — REQUEST DTOs (in HorusVis.Business/Models/Projects/)
──────────────────────────────────────────────────────────

2. **ProjectListFilter.cs** — query params object (NOT a record — use a class for binding):
   ```csharp
   public sealed class ProjectListFilter
   {
       public string? Status     { get; set; }
       public Guid?   OwnerId    { get; set; }
       public int     Page       { get; set; } = 1;
       public int     PageSize   { get; set; } = 20;
   }
   ```

   **CreateProjectRequest.cs** — use DataAnnotations for validation:
   ```csharp
   public sealed class CreateProjectRequest
   {
       [Required] [MaxLength(20)] [RegularExpression("^[A-Z0-9]{2,20}$")]
       public required string ProjectKey { get; set; }
       [Required] [MaxLength(150)]
       public required string ProjectName { get; set; }
       public string?   Description { get; set; }
       public DateOnly? StartDate   { get; set; }
       public DateOnly? EndDate     { get; set; }
   }
   ```

   **UpdateProjectRequest.cs**:
   ```csharp
   public sealed class UpdateProjectRequest
   {
       [MaxLength(150)] public string?   ProjectName  { get; set; }
       public string?   Description  { get; set; }
       public string?   Status       { get; set; }   // "Draft"|"Active"|"OnHold"|"Archived"
       public DateOnly? StartDate    { get; set; }
       public DateOnly? EndDate      { get; set; }
   }
   ```

   **AddProjectMemberRequest.cs**:
   ```csharp
   public sealed class AddProjectMemberRequest
   {
       [Required] public required Guid   UserId      { get; set; }
       [Required] [MaxLength(30)] public required string ProjectRole { get; set; }
   }
   ```

   **UpdateProjectMemberRequest.cs**:
   ```csharp
   public sealed class UpdateProjectMemberRequest
   {
       [MaxLength(30)] public string? ProjectRole  { get; set; }
       public string? MemberStatus { get; set; }  // "Active"|"Inactive"
   }
   ```

   **CreateFeatureAreaRequest.cs**:
   ```csharp
   public sealed class CreateFeatureAreaRequest
   {
       [Required] [MaxLength(30)]  public required string AreaCode { get; set; }
       [Required] [MaxLength(100)] public required string AreaName { get; set; }
       [MaxLength(20)] public string? ColorHex  { get; set; }
       public int? SortOrder { get; set; }
   }
   ```

──────────────────────────────────────────────────────────
PART C — SERVICE INTERFACES
──────────────────────────────────────────────────────────

3. UPDATE `IProjectsService.cs` (replace empty interface):
   ```csharp
   using HorusVis.Business.Models.Projects;

   Task<ProjectListResponse>   GetProjectsAsync(ProjectListFilter filter, CancellationToken ct);
   Task<ProjectDetailResponse> GetProjectByIdAsync(Guid projectId, CancellationToken ct);
   Task<ProjectDetailResponse> CreateProjectAsync(CreateProjectRequest req, Guid ownerUserId, CancellationToken ct);
   Task<ProjectDetailResponse> UpdateProjectAsync(Guid projectId, UpdateProjectRequest req, Guid callerId, CancellationToken ct);
   Task                        ArchiveProjectAsync(Guid projectId, Guid callerId, CancellationToken ct);
   ```

4. CREATE `IProjectMembersService.cs` at `backend/src/HorusVis.Business/Contracts/IProjectMembersService.cs`:
   ```csharp
   Task<IReadOnlyList<ProjectMemberDto>> GetMembersAsync(Guid projectId, CancellationToken ct);
   Task<ProjectMemberDto>                AddMemberAsync(Guid projectId, AddProjectMemberRequest req, Guid callerId, CancellationToken ct);
   Task<ProjectMemberDto>                UpdateMemberAsync(Guid projectId, Guid memberId, UpdateProjectMemberRequest req, Guid callerId, CancellationToken ct);
   Task                                  RemoveMemberAsync(Guid projectId, Guid memberId, Guid callerId, CancellationToken ct);
   ```

5. CREATE `IFeatureAreasService.cs` at `backend/src/HorusVis.Business/Contracts/IFeatureAreasService.cs`:
   ```csharp
   Task<IReadOnlyList<FeatureAreaDto>> GetFeatureAreasAsync(Guid projectId, CancellationToken ct);
   Task<FeatureAreaDto>                CreateFeatureAreaAsync(Guid projectId, CreateFeatureAreaRequest req, CancellationToken ct);
   Task                                DeleteFeatureAreaAsync(Guid projectId, Guid areaId, CancellationToken ct);
   ```

──────────────────────────────────────────────────────────
PART D — SERVICE IMPLEMENTATIONS
──────────────────────────────────────────────────────────

6. IMPLEMENT `ProjectsService.cs` (replace scaffold).
   Inject: `HorusVisDbContext dbContext`.
   Use `dbContext.Set<T>()` for all queries (no explicit DbSet properties on DbContext).

   GetProjectsAsync:
   - Filter by Status enum (parse string to ProjectStatus) if filter.Status is not null.
   - Filter by OwnerId if not null.
   - Include owner user for OwnerDisplayName (join on User.FullName).
   - Count members with a separate GroupBy or scalar subquery for MemberCount.
   - Offset pagination: .Skip((filter.Page - 1) * filter.PageSize).Take(filter.PageSize).
   - TotalCount: count BEFORE pagination.

   GetProjectByIdAsync:
   - Load project + owner user + members (with user info) + feature areas.
   - Throw `KeyNotFoundException($"Project {projectId} not found.")` if absent.

   CreateProjectAsync:
   - Check uniqueness: if dbContext.Set<Project>().AnyAsync(p => p.ProjectKey == req.ProjectKey)
     → throw InvalidOperationException("Project key already in use.")
   - Create Project entity with new Guid, Status = ProjectStatus.Active, CreatedAt = UtcNow.
   - Add owner as ProjectMember (ProjectRole = "Owner", MemberStatus = MemberStatus.Active).
   - await dbContext.SaveChangesAsync(ct).
   - Return GetProjectByIdAsync(newId, ct).

   UpdateProjectAsync:
   - Load project, throw KeyNotFoundException if absent.
   - Auth check: if project.OwnerUserId != callerId → throw UnauthorizedAccessException.
   - Apply non-null fields from request (patch semantics).
   - If req.Status is set, parse to ProjectStatus enum (throw ArgumentException for invalid).
   - await dbContext.SaveChangesAsync(ct).
   - Return GetProjectByIdAsync(projectId, ct).

   ArchiveProjectAsync:
   - Load project, throw KeyNotFoundException if absent.
   - Auth check: if project.OwnerUserId != callerId → throw UnauthorizedAccessException.
   - Set Status = ProjectStatus.Archived.
   - await dbContext.SaveChangesAsync(ct).

7. IMPLEMENT `ProjectMembersService.cs`.
   Inject: `HorusVisDbContext dbContext`.

   GetMembersAsync:
   - Load ProjectMembers where ProjectId == projectId, join User for display info.
   - Project to ProjectMemberDto list.

   AddMemberAsync:
   - Load project (throw KeyNotFound if absent). Auth check: callerId == project.OwnerUserId.
   - Check duplicate: AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == req.UserId)
     → throw InvalidOperationException("User is already a member.").
   - Verify user exists (load User, throw KeyNotFound if not).
   - Create ProjectMember, SaveChangesAsync, return DTO.

   UpdateMemberAsync:
   - Load project, auth check. Load member (throw KeyNotFound if absent).
   - Apply non-null fields from request. ParseMemberStatus if set.
   - SaveChangesAsync, return updated DTO.

   RemoveMemberAsync:
   - Load project, auth check. Load member, remove, SaveChangesAsync.

8. IMPLEMENT `FeatureAreasService.cs`.
   Inject: `HorusVisDbContext dbContext`.

   GetFeatureAreasAsync:
   - Load FeatureAreas where ProjectId == projectId, ordered by SortOrder then AreaName.

   CreateFeatureAreaAsync:
   - Create FeatureArea with new Guid, map from request. SaveChangesAsync.

   DeleteFeatureAreaAsync:
   - Load feature area where ProjectId == projectId && Id == areaId.
   - Throw KeyNotFoundException if absent. Remove, SaveChangesAsync.

9. UPDATE `ServiceCollectionExtensions.cs` — add after IReportExportService registrations:
   ```csharp
   services.AddScoped<IProjectMembersService, ProjectMembersService>();
   services.AddScoped<IFeatureAreasService, FeatureAreasService>();
   ```
   IProjectsService is ALREADY registered — do NOT duplicate it.

──────────────────────────────────────────────────────────
PART E — CONTROLLER
──────────────────────────────────────────────────────────

10. REPLACE `ProjectsController.cs` fully:

    Inject: IProjectsService, IProjectMembersService, IFeatureAreasService (primary constructor).
    Extract callerId via:
      `var callerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);`
    Catch pattern (per action):
      - UnauthorizedAccessException → return Forbid()
      - KeyNotFoundException        → return NotFound(e.Message)
      - InvalidOperationException   → return Conflict(e.Message)

    Endpoints (all [Authorize]):
    ```
    GET    /api/projects                                    → GetProjectsAsync([FromQuery] ProjectListFilter)
    POST   /api/projects                                    → CreateProjectAsync([FromBody] CreateProjectRequest)
    GET    /api/projects/{projectId}                        → GetProjectByIdAsync
    PUT    /api/projects/{projectId}                        → UpdateProjectAsync([FromBody] UpdateProjectRequest)
    DELETE /api/projects/{projectId}                        → ArchiveProjectAsync

    GET    /api/projects/{projectId}/members                → GetMembersAsync
    POST   /api/projects/{projectId}/members                → AddMemberAsync([FromBody] AddProjectMemberRequest)
    PUT    /api/projects/{projectId}/members/{memberId}     → UpdateMemberAsync([FromBody] UpdateProjectMemberRequest)
    DELETE /api/projects/{projectId}/members/{memberId}     → RemoveMemberAsync

    GET    /api/projects/{projectId}/feature-areas          → GetFeatureAreasAsync
    POST   /api/projects/{projectId}/feature-areas          → CreateFeatureAreaAsync([FromBody] CreateFeatureAreaRequest)
    DELETE /api/projects/{projectId}/feature-areas/{areaId} → DeleteFeatureAreaAsync
    ```

    POST returns 201 Created with the created resource.
    DELETE returns 204 NoContent on success.
    GET/PUT return 200 Ok.

11. ENUM HANDLING NOTE:
    ProjectStatus values: Draft, Active, OnHold, Archived.
    MemberStatus values: Active, Inactive.
    Both are stored as strings in DB (EF Core convention set in HorusVisDbContext).
    Use enum directly in LINQ; do NOT compare with string literals.
</requirements>

<output>
Files to create:
- backend/src/HorusVis.Business/Models/Projects/ProjectListItem.cs
- backend/src/HorusVis.Business/Models/Projects/ProjectListResponse.cs
- backend/src/HorusVis.Business/Models/Projects/ProjectDetailResponse.cs
- backend/src/HorusVis.Business/Models/Projects/ProjectMemberDto.cs
- backend/src/HorusVis.Business/Models/Projects/FeatureAreaDto.cs
- backend/src/HorusVis.Business/Models/Projects/ProjectListFilter.cs
- backend/src/HorusVis.Business/Models/Projects/CreateProjectRequest.cs
- backend/src/HorusVis.Business/Models/Projects/UpdateProjectRequest.cs
- backend/src/HorusVis.Business/Models/Projects/AddProjectMemberRequest.cs
- backend/src/HorusVis.Business/Models/Projects/UpdateProjectMemberRequest.cs
- backend/src/HorusVis.Business/Models/Projects/CreateFeatureAreaRequest.cs
- backend/src/HorusVis.Business/Contracts/IProjectMembersService.cs
- backend/src/HorusVis.Business/Contracts/IFeatureAreasService.cs
- backend/src/HorusVis.Business/Services/ProjectMembersService.cs
- backend/src/HorusVis.Business/Services/FeatureAreasService.cs

Files to modify:
- backend/src/HorusVis.Business/Contracts/IProjectsService.cs
- backend/src/HorusVis.Business/Services/ProjectsService.cs
- backend/src/HorusVis.Business/ServiceCollectionExtensions.cs
- backend/src/HorusVis.Web/Controllers/ProjectsController.cs
</output>

<verification>
Before declaring complete:
1. Run: cd backend && dotnet build HorusVis.sln
   → Must exit 0 with 0 errors
2. Confirm IProjectsService has 5 method signatures
3. Confirm ProjectsController has 13 action methods (no placeholder)
4. Confirm ProjectsService.CreateProjectAsync adds owner as first ProjectMember
5. Confirm UnauthorizedAccessException caught → Forbid() in controller
6. Confirm KeyNotFoundException caught → NotFound() in controller
7. Confirm ProjectListFilter is a class (not record) for [FromQuery] binding
8. Confirm FeatureArea delete endpoint is included
9. Confirm IProjectMembersService + IFeatureAreasService registered in DI
</verification>

<summary_requirements>
Create `.prompts/020-projects-be-crud-do/SUMMARY.md`

Template:
# Projects BE CRUD — SUMMARY
**{one-liner}**

## Version
v1

## Key Findings
- {DTOs and services created}
- {authorization pattern used}
- {notable EF Core patterns}

## Files Created
- list all created/modified files

## Decisions Needed
- Q1: Milestones table absent — CriticalDatesCard will show null milestone in Phase 2.

## Blockers
{build errors if any, or None}

## Next Step
Run Phase 2: `021-projects-be-overview-do.md`
</summary_requirements>

<success_criteria>
- All 11 DTO/request model files created in HorusVis.Business/Models/Projects/
- IProjectsService: 5 methods; IProjectMembersService: 4 methods; IFeatureAreasService: 3 methods
- ProjectsService: full implementation with pagination, owner auth checks, SaveChangesAsync
- ProjectMembersService: duplicate-member guard, caller auth check
- FeatureAreasService: scope-guarded by projectId
- ProjectsController: 13 endpoints, correct HTTP verbs, 201/204/403/404/409 responses
- IProjectMembersService + IFeatureAreasService registered in ServiceCollectionExtensions
- `dotnet build HorusVis.sln` passes with 0 errors
- SUMMARY.md created at .prompts/020-projects-be-crud-do/SUMMARY.md
</success_criteria>
