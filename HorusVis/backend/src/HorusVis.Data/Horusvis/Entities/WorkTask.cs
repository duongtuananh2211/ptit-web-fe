using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HorusVis.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

/// <summary>
/// Represents a planned work item (User Story). Belongs to a Project.
/// Progress is recalculated automatically from subtask effort on every subtask update:
/// ProgressPercent = MIN(100, SUM(ActualHours) / SUM(EstimateHours) * 100)
/// </summary>
[Table("Tasks")]
public class WorkTask
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    public required Guid ProjectId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(ProjectId))]
    public Project Project { get; set; } = null!;

    public Guid? FeatureAreaId { get; set; }

    [DeleteBehavior(DeleteBehavior.SetNull)]
    [ForeignKey(nameof(FeatureAreaId))]
    public FeatureArea? FeatureArea { get; set; }

    /// <summary>Backlog when null; assigned to a sprint when set.</summary>
    public Guid? SprintId { get; set; }

    [DeleteBehavior(DeleteBehavior.SetNull)]
    [ForeignKey(nameof(SprintId))]
    public Sprint? Sprint { get; set; }

    [Required]
    [MaxLength(200)]
    public required string Title { get; set; }

    public string? Description { get; set; }

    public required WorkTaskPriority Priority { get; set; }

    public required WorkTaskStatus Status { get; set; }

    /// <summary>
    /// Reason the task is blocked. Set when Status transitions to Stuck.
    /// </summary>
    public string? BlockedNote { get; set; }

    /// <summary>
    /// Story points estimate, equivalent to Plan Estimate in Rally.
    /// </summary>
    [Column(TypeName = "numeric(5,1)")]
    public decimal? PlanEstimate { get; set; }

    /// <summary>
    /// Automatically computed from subtask effort. Do not set manually.
    /// </summary>
    [Column(TypeName = "numeric(5,2)")]
    public decimal? ProgressPercent { get; set; }

    public required Guid CreatedByUserId { get; set; }

    [DeleteBehavior(DeleteBehavior.Restrict)]
    [ForeignKey(nameof(CreatedByUserId))]
    public User CreatedByUser { get; set; } = null!;

    public DateOnly? StartDate { get; set; }

    public DateOnly? DueDate { get; set; }

    public required DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }
}
