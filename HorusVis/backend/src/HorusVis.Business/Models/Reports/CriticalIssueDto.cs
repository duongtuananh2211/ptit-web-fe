namespace HorusVis.Business.Models.Reports;

public sealed record CriticalIssueDto(
    Guid           Id,
    string         IssueCode,
    string         Title,
    string         Priority,
    string         Severity,
    string         Status,
    string?        AssigneeName,
    DateTimeOffset OpenedAt,
    DateOnly?      DueDate
);
