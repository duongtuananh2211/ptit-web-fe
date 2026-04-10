namespace HorusVis.Web.Contracts.Tasks;

public sealed record UpdateTaskRequest(
    string Title,
    string? Description,
    string Status,
    string Priority,
    Guid? AssigneeUserId = null,
    string? BlockedNote = null,
    DateOnly? StartDate = null,
    DateOnly? DueDate = null
);
