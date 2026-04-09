using HorusVis.Business.Models.Projects;

namespace HorusVis.Business.Contracts;

public interface IProjectMembersService
{
    Task<IReadOnlyList<ProjectMemberDto>> GetMembersAsync(Guid projectId, Guid callerId, CancellationToken ct = default);
    Task<ProjectMemberDto>                AddMemberAsync(Guid projectId, AddProjectMemberRequest request, Guid callerId, CancellationToken ct = default);
    Task<ProjectMemberDto>                UpdateMemberAsync(Guid projectId, Guid memberId, UpdateProjectMemberRequest request, Guid callerId, CancellationToken ct = default);
    Task                                  RemoveMemberAsync(Guid projectId, Guid memberId, Guid callerId, CancellationToken ct = default);
}
