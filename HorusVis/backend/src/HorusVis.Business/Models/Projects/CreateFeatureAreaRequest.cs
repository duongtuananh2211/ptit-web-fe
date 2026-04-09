namespace HorusVis.Business.Models.Projects;

public sealed record CreateFeatureAreaRequest(
    string  AreaCode,
    string  AreaName,
    string? ColorHex,
    int?    SortOrder
);
