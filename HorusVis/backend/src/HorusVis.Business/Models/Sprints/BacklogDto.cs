namespace HorusVis.Business.Models.Sprints;

public sealed record BacklogDto(
    IReadOnlyList<BacklogTaskItem>  Tasks,
    IReadOnlyList<BacklogIssueItem> Issues
);
