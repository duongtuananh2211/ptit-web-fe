namespace HorusVis.Business.Models.Sprints;

public sealed record BacklogIssueItem(
    Guid   Id,
    string IssueCode,
    string Title,
    string Severity,
    string Status,
    Guid   ProjectId,
    string ProjectName
);
