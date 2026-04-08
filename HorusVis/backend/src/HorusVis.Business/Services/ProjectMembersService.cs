using HorusVis.Business.Contracts;
using HorusVis.Business.Models.Projects;
using HorusVis.Data.Enums;
using HorusVis.Data.Persistence;
using HorusVis.Data.Horusvis.Entities;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Business.Services;

public sealed class ProjectMembersService(HorusVisDbContext dbContext) : IProjectMembersService
{
    public async Task<IReadOnlyList<ProjectMemberDto>> GetMembersAsync(Guid projectId, Guid callerId, CancellationToken ct = default)
    {
        await EnsureProjectExistsAsync(projectId, ct);

        return await dbContext.Set<ProjectMember>()
            .Where(m => m.ProjectId == projectId)
            .Join(dbContext.Set<User>(), m => m.UserId, u => u.Id, (m, u) => new ProjectMemberDto(
                MemberId:     m.Id,
                UserId:       m.UserId,
                DisplayName:  u.FullName,
                Email:        u.Email,
                AvatarUrl:    u.AvatarUrl,
                ProjectRole:  m.ProjectRole,
                MemberStatus: m.MemberStatus.ToString(),
                JoinedAt:     m.JoinedAt.UtcDateTime
            ))
            .ToListAsync(ct);
    }

    public async Task<ProjectMemberDto> AddMemberAsync(Guid projectId, AddProjectMemberRequest request, Guid callerId, CancellationToken ct = default)
    {
        await EnsureCallerIsOwnerAsync(projectId, callerId, ct);

        var duplicate = await dbContext.Set<ProjectMember>()
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == request.UserId, ct);

        if (duplicate)
            throw new InvalidOperationException("User is already a member of this project.");

        var member = new ProjectMember
        {
            Id           = Guid.NewGuid(),
            ProjectId    = projectId,
            UserId       = request.UserId,
            ProjectRole  = request.ProjectRole,
            MemberStatus = MemberStatus.Active,
            JoinedAt     = DateTimeOffset.UtcNow,
        };

        dbContext.Set<ProjectMember>().Add(member);
        await dbContext.SaveChangesAsync(ct);

        var user = await dbContext.Set<User>().FindAsync([request.UserId], ct)
            ?? throw new KeyNotFoundException($"User {request.UserId} not found.");

        return new ProjectMemberDto(
            MemberId:     member.Id,
            UserId:       member.UserId,
            DisplayName:  user.FullName,
            Email:        user.Email,
            AvatarUrl:    user.AvatarUrl,
            ProjectRole:  member.ProjectRole,
            MemberStatus: member.MemberStatus.ToString(),
            JoinedAt:     member.JoinedAt.UtcDateTime
        );
    }

    public async Task<ProjectMemberDto> UpdateMemberAsync(Guid projectId, Guid memberId, UpdateProjectMemberRequest request, Guid callerId, CancellationToken ct = default)
    {
        await EnsureCallerIsOwnerAsync(projectId, callerId, ct);

        var member = await dbContext.Set<ProjectMember>()
            .FirstOrDefaultAsync(m => m.Id == memberId && m.ProjectId == projectId, ct)
            ?? throw new KeyNotFoundException($"Member {memberId} not found in project {projectId}.");

        if (!Enum.TryParse<MemberStatus>(request.MemberStatus, ignoreCase: true, out var newStatus))
            throw new InvalidOperationException($"Invalid member status '{request.MemberStatus}'.");

        member.ProjectRole  = request.ProjectRole;
        member.MemberStatus = newStatus;

        await dbContext.SaveChangesAsync(ct);

        var user = await dbContext.Set<User>().FindAsync([member.UserId], ct)
            ?? throw new KeyNotFoundException($"User {member.UserId} not found.");

        return new ProjectMemberDto(
            MemberId:     member.Id,
            UserId:       member.UserId,
            DisplayName:  user.FullName,
            Email:        user.Email,
            AvatarUrl:    user.AvatarUrl,
            ProjectRole:  member.ProjectRole,
            MemberStatus: member.MemberStatus.ToString(),
            JoinedAt:     member.JoinedAt.UtcDateTime
        );
    }

    public async Task RemoveMemberAsync(Guid projectId, Guid memberId, Guid callerId, CancellationToken ct = default)
    {
        await EnsureCallerIsOwnerAsync(projectId, callerId, ct);

        var member = await dbContext.Set<ProjectMember>()
            .FirstOrDefaultAsync(m => m.Id == memberId && m.ProjectId == projectId, ct)
            ?? throw new KeyNotFoundException($"Member {memberId} not found in project {projectId}.");

        dbContext.Set<ProjectMember>().Remove(member);
        await dbContext.SaveChangesAsync(ct);
    }

    // ─── private helpers ───────────────────────────────────────────────────────

    private async Task EnsureProjectExistsAsync(Guid projectId, CancellationToken ct)
    {
        var exists = await dbContext.Set<Project>().AnyAsync(p => p.Id == projectId, ct);
        if (!exists)
            throw new KeyNotFoundException($"Project {projectId} not found.");
    }

    private async Task EnsureCallerIsOwnerAsync(Guid projectId, Guid callerId, CancellationToken ct)
    {
        var project = await dbContext.Set<Project>()
            .FirstOrDefaultAsync(p => p.Id == projectId, ct)
            ?? throw new KeyNotFoundException($"Project {projectId} not found.");

        if (project.OwnerUserId != callerId)
            throw new UnauthorizedAccessException("Only the project owner can manage members.");
    }
}
