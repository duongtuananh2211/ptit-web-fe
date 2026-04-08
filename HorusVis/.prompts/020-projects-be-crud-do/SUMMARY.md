# 020 — Projects BE CRUD

**Projects CRUD backend complete: 3 services, 2 new interfaces, 11 DTOs, 13 controller endpoints**

## Version
v1 — executed April 9, 2026

## Files Created
- `HorusVis.Business/Models/Projects/ProjectListItem.cs`
- `HorusVis.Business/Models/Projects/ProjectListResponse.cs`
- `HorusVis.Business/Models/Projects/ProjectDetailResponse.cs`
- `HorusVis.Business/Models/Projects/ProjectMemberDto.cs`
- `HorusVis.Business/Models/Projects/FeatureAreaDto.cs`
- `HorusVis.Business/Models/Projects/ProjectListFilter.cs`
- `HorusVis.Business/Models/Projects/CreateProjectRequest.cs`
- `HorusVis.Business/Models/Projects/UpdateProjectRequest.cs`
- `HorusVis.Business/Models/Projects/AddProjectMemberRequest.cs`
- `HorusVis.Business/Models/Projects/UpdateProjectMemberRequest.cs`
- `HorusVis.Business/Models/Projects/CreateFeatureAreaRequest.cs`
- `HorusVis.Business/Contracts/IProjectMembersService.cs`
- `HorusVis.Business/Contracts/IFeatureAreasService.cs`
- `HorusVis.Business/Services/ProjectMembersService.cs`
- `HorusVis.Business/Services/FeatureAreasService.cs`

## Files Modified
- `HorusVis.Business/Contracts/IProjectsService.cs` — added 5 method signatures
- `HorusVis.Business/Services/ProjectsService.cs` — full implementation (was empty scaffold)
- `HorusVis.Business/ServiceCollectionExtensions.cs` — registered IProjectMembersService, IFeatureAreasService
- `HorusVis.Web/Controllers/ProjectsController.cs` — replaced placeholder with 13 endpoints

## Key Findings
- `ProjectsService` uses pagination (`Skip`/`Take`), owner auth guard, `CreateProject` auto-adds owner as first member with role "Owner"
- `ProjectMembersService` and `FeatureAreasService` enforce owner-only writes via `EnsureCallerIsOwnerAsync`
- Duplicate guards: project key uniqueness, member uniqueness per project, feature area code uniqueness per project
- All enums converted to strings in response DTOs (`.ToString()`)
- `HorusVisDbContext` namespace is `HorusVis.Data.Persistence` (not `.Data.Horusvis`)

## Decisions Needed
None

## Blockers
None

## Next Step
020 complete → 021 (Projects BE Overview) executed immediately after
