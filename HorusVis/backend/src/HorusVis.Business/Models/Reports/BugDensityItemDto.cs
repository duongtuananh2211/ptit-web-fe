namespace HorusVis.Business.Models.Reports;

public sealed record BugDensityItemDto(
    string  FeatureArea,
    int     OpenCount,
    int     ResolvedCount,
    double? AvgTimeToCloseHours
);
