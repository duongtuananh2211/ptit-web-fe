namespace HorusVis.Business.Contracts.Admin;

public sealed record DeploymentAdminDto(
    Guid Id,
    string Environment,
    string VersionLabel,
    DateTimeOffset StartedAt,
    DateTimeOffset? FinishedAt,
    string Status,
    string? TriggeredByUserEmail);
