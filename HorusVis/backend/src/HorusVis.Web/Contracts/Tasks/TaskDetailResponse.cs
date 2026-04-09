using HorusVis.Web.Contracts.Issues;
using HorusVis.Web.Contracts.Subtasks;

namespace HorusVis.Web.Contracts.Tasks;

public sealed record TaskDetailResponse(
    Guid Id,
    Guid ProjectId,
    string Title,
    string? Description,
    string Priority,
    string Status,
    string? BlockedNote,
    decimal? ProgressPercent,
    decimal? PlanEstimate,
    DateOnly? StartDate,
    DateOnly? DueDate,
    Guid CreatedByUserId,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    List<IssueResponse> Issues,
    List<SubtaskResponse> Subtasks,
    FeatureAreaResponse? FeatureArea = null
);
