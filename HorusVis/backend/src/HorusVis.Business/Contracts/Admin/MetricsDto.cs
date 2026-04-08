namespace HorusVis.Business.Contracts.Admin;

public sealed record MetricsDto(
    int TotalUsers,
    int ActiveSessions,
    decimal AvgCpuLoadPercent,
    decimal AvgMemoryLoadPercent);

public sealed record NodeAdminDto(
    Guid Id,
    string NodeName,
    string Environment,
    decimal? CpuLoadPercent,
    decimal? MemoryLoadPercent,
    string Status,
    DateTimeOffset? LastHeartbeatAt);
