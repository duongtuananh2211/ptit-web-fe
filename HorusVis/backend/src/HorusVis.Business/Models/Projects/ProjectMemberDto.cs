namespace HorusVis.Business.Models.Projects;

public sealed record ProjectMemberDto(
    Guid    MemberId,
    Guid    UserId,
    string  DisplayName,
    string  Email,
    string? AvatarUrl,
    string  ProjectRole,
    string  MemberStatus,
    DateTimeOffset JoinedAt
);
