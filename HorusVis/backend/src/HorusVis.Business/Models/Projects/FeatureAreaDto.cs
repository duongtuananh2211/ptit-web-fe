namespace HorusVis.Business.Models.Projects;

public sealed record FeatureAreaDto(
    Guid    Id,
    string  AreaCode,
    string  AreaName,
    string? ColorHex,
    int?    SortOrder
);
