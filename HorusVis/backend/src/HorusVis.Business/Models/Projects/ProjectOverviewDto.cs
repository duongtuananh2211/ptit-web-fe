namespace HorusVis.Business.Models.Projects;

public sealed record ProjectOverviewDto(
    decimal                          VelocityScore,
    MilestoneDto?                    NextMilestone,
    IReadOnlyList<TeamWorkloadItem>  TeamWorkload,
    TaskSummaryDto                   TaskSummary
);
