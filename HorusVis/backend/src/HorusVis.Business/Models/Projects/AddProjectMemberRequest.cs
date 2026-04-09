namespace HorusVis.Business.Models.Projects;

public sealed record AddProjectMemberRequest(
    Guid   UserId,
    string ProjectRole
);
