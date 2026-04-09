namespace HorusVis.Business.Models.Sprints;

public sealed record SprintBoardColumn(
    string                             Status,
    int                                TaskCount,
    IReadOnlyList<SprintBoardTaskItem> Tasks
);
