namespace HorusVis.Business.Models.Projects;

public sealed record ProjectListItem(
    Guid      Id,
    string    ProjectKey,
    string    ProjectName,
    string    Status,
    Guid      OwnerUserId,
    string    OwnerDisplayName,
    DateOnly? StartDate,
    DateOnly? EndDate,
    int       MemberCount
);
