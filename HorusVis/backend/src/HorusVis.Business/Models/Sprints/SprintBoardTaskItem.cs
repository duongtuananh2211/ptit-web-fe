namespace HorusVis.Business.Models.Sprints;

public sealed record SprintBoardTaskItem(
    Guid    Id,
    string  Title,
    string  Status,
    string  Priority,
    Guid?   AssigneeUserId,
    string? AssigneeName
);
