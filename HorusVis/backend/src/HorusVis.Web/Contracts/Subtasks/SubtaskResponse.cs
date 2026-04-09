namespace HorusVis.Web.Contracts.Subtasks;

public sealed record SubtaskResponse(
    Guid Id,
    string SubtaskCode,
    string Title,
    string? Description,
    string State,
    Guid? OwnerUserId,
    decimal EstimateHours,
    decimal ToDoHours,
    decimal ActualHours,
    DateOnly? DueDate,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    Guid? TaskId = null,
    Guid? IssueId = null
);
