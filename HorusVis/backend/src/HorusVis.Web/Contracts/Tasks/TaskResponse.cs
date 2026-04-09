namespace HorusVis.Web.Contracts.Tasks;

public sealed record TaskResponse(
    Guid Id,
    Guid ProjectId,
    string Title,
    string? Description,
    string Priority,
    string Status,
    string? BlockedNote,
    decimal? ProgressPercent,
    decimal? PlanEstimate,
    DateOnly? StartDate,
    DateOnly? DueDate,
    Guid CreatedByUserId,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    FeatureAreaResponse? FeatureArea = null
);
