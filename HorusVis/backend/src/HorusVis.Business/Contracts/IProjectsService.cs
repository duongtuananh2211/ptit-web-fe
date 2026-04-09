using HorusVis.Business.Models.Projects;

namespace HorusVis.Business.Contracts;

public interface IProjectsService
{
    Task<ProjectListResponse>   GetProjectsAsync(ProjectListFilter filter, Guid callerId, CancellationToken ct = default);
    Task<ProjectDetailResponse> GetProjectByIdAsync(Guid projectId, Guid callerId, CancellationToken ct = default);
    Task<ProjectDetailResponse> CreateProjectAsync(CreateProjectRequest request, Guid callerId, CancellationToken ct = default);
    Task<ProjectDetailResponse> UpdateProjectAsync(Guid projectId, UpdateProjectRequest request, Guid callerId, CancellationToken ct = default);
    Task                        ArchiveProjectAsync(Guid projectId, Guid callerId, CancellationToken ct = default);
    Task<ProjectOverviewDto>     GetProjectOverviewAsync(Guid projectId, CancellationToken ct = default);
    Task<ProjectBoardPreviewDto> GetBoardPreviewAsync(Guid projectId, CancellationToken ct = default);
}
