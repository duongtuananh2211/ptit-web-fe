namespace HorusVis.Web.Contracts.Tasks;

public sealed record FeatureAreaResponse(
    Guid Id,
    string AreaCode,
    string AreaName,
    string? ColorHex
);
