namespace HorusVis.Business.Models.Projects;

public sealed record BoardTaskPreviewItem(
    Guid          Id,
    string        Title,
    string?       Description,
    string        Priority,
    string        Status,
    decimal?      ProgressPercent,
    decimal?      PlanEstimate,
    string?       BlockedNote,
    DateOnly?     StartDate,
    DateOnly?     DueDate,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    Guid?         FeatureAreaId,
    string?       FeatureAreaCode,
    string?       FeatureAreaName,
    string?       FeatureAreaColorHex,
    Guid?         AssigneeUserId,
    string?       AssigneeDisplayName,
    string?       AssigneeAvatarUrl
);
