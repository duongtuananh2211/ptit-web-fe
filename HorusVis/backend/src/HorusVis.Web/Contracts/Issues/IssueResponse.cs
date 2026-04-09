namespace HorusVis.Web.Contracts.Issues;

public sealed record IssueResponse(
    Guid Id,
    Guid ProjectId,
    string IssueCode,
    string Title,
    string Summary,
    string Severity,
    string Priority,
    string Status,
    string WorkflowStage,
    Guid ReporterUserId,
    Guid? CurrentAssigneeUserId,
    Guid? VerifiedByUserId,
    DateOnly? DueDate,
    DateTimeOffset OpenedAt,
    DateTimeOffset? ResolvedAt,
    DateTimeOffset? ClosedAt,
    Guid? TaskId = null
);
