namespace HorusVis.Business.Models.Reports;

public sealed record RecommendationItemDto(
    string RuleKey,
    string Title,
    string Detail
);
