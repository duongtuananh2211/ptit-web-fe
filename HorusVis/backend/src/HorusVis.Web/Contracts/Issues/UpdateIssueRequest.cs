namespace HorusVis.Web.Contracts.Issues;

public sealed record UpdateIssueRequest(
    string Title,
    string Summary,
    string Status,
    string Severity,
    string Priority,
    string WorkflowStage,
    Guid? CurrentAssigneeUserId = null,
    Guid? VerifiedByUserId = null,
    DateOnly? DueDate = null
);
