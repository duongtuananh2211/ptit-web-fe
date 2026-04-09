namespace HorusVis.Business.Models.Sprints;

public sealed record SprintBoardDto(
    SprintDto                           Sprint,
    IReadOnlyList<SprintBoardColumn>    TaskColumns,
    IReadOnlyList<SprintBoardIssueItem> Issues
);
