namespace HorusVis.Business.Models.Sprints;

public sealed record SprintBoardIssueItem(
    Guid    Id,
    string  IssueCode,
    string  Title,
    string  Severity,
    string  Status,
    Guid?   AssigneeUserId,
    string? AssigneeName
);
