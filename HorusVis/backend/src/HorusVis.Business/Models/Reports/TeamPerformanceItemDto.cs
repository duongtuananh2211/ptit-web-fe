namespace HorusVis.Business.Models.Reports;

public sealed record TeamPerformanceItemDto(
    Guid    UserId,
    string  FullName,
    string? AvatarUrl,
    int     TasksCompleted,
    decimal TotalPoints
);
