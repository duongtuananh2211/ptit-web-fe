namespace HorusVis.Web.Contracts.Tasks;

public sealed record CreateTaskRequest(
    Guid ProjectId,
    string Title,
    string? Description,
    string Priority,
    Guid? FeatureAreaId = null,
    decimal? PlanEstimate = null,
    DateOnly? StartDate = null,
    DateOnly? DueDate = null
);
