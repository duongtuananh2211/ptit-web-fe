namespace HorusVis.Web.Contracts.Subtasks;

public sealed record CreateSubtaskRequest(
    string Title,
    string? Description,
    decimal EstimateHours,
    decimal ToDoHours,
    Guid? OwnerUserId = null,
    DateOnly? DueDate = null
);
