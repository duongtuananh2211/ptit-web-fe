namespace HorusVis.Business.Models.Sprints;

public sealed record BacklogTaskItem(
    Guid    Id,
    string  Title,
    string  Status,
    string  Priority,
    Guid    ProjectId,
    string  ProjectName,
    Guid?   FeatureAreaId,
    string? FeatureAreaName
);
