using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HorusVis.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

/// <summary>
/// Represents a defect or bug. Can be standalone (TaskId = null) or linked to a WorkTask.
/// IssueCode format: ISS-NNN.
/// </summary>
[Table("Issues")]
[Index(nameof(IssueCode), IsUnique = true)]
public class Issue
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    public required Guid ProjectId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(ProjectId))]
    public Project Project { get; set; } = null!;

    /// <summary>
    /// Optional link to a parent WorkTask. Nullable — an issue can exist independently of any task.
    /// </summary>
    public Guid? TaskId { get; set; }

    [DeleteBehavior(DeleteBehavior.SetNull)]
    [ForeignKey(nameof(TaskId))]
    public WorkTask? Task { get; set; }

    [Required]
    [MaxLength(20)]
    public required string IssueCode { get; set; }

    [Required]
    [MaxLength(200)]
    public required string Title { get; set; }

    [Required]
    public required string Summary { get; set; }

    public required IssueSeverity Severity { get; set; }

    public required WorkTaskPriority Priority { get; set; }

    public required IssueStatus Status { get; set; }

    public required IssueWorkflowStage WorkflowStage { get; set; }

    public required Guid ReporterUserId { get; set; }

    [DeleteBehavior(DeleteBehavior.Restrict)]
    [ForeignKey(nameof(ReporterUserId))]
    public User ReporterUser { get; set; } = null!;

    public Guid? CurrentAssigneeUserId { get; set; }

    [DeleteBehavior(DeleteBehavior.SetNull)]
    [ForeignKey(nameof(CurrentAssigneeUserId))]
    public User? CurrentAssigneeUser { get; set; }

    public Guid? VerifiedByUserId { get; set; }

    [DeleteBehavior(DeleteBehavior.SetNull)]
    [ForeignKey(nameof(VerifiedByUserId))]
    public User? VerifiedByUser { get; set; }

    public DateOnly? DueDate { get; set; }

    public required DateTimeOffset OpenedAt { get; set; }

    public DateTimeOffset? ResolvedAt { get; set; }

    public DateTimeOffset? ClosedAt { get; set; }
}
