namespace HorusVis.Business.Models.Projects;

public sealed record ProjectListResponse(
    IReadOnlyList<ProjectListItem> Items,
    int                           TotalCount,
    int                           PageNumber,
    int                           PageSize
);
