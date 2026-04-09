namespace HorusVis.Web.Contracts.Subtasks;

public sealed record UpdateSubtaskRequest(
    string Title,
    string? Description,
    string State,
    decimal EstimateHours,
    decimal ToDoHours,
    decimal ActualHours,
    Guid? OwnerUserId = null,
    DateOnly? DueDate = null
);
