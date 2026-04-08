namespace HorusVis.Business.Models.Projects;

public sealed record UpdateProjectMemberRequest(
    string ProjectRole,
    string MemberStatus
);
