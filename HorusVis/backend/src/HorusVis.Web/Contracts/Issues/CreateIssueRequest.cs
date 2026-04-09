namespace HorusVis.Web.Contracts.Issues;

public sealed record CreateIssueRequest(
    Guid ProjectId,
    string Title,
    string Summary,
    string Severity,
    string Priority,
    Guid? TaskId = null,
    DateOnly? DueDate = null
);
