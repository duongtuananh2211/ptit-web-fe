using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HorusVis.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

/// <summary>
/// Represents a granular work item for effort tracking (Estimate / To Do / Actuals).
/// Must belong to exactly one parent: either TaskId or IssueId, not both.
/// SubtaskCode format: ST-NNN.
/// </summary>
[Table("Subtasks")]
[Index(nameof(SubtaskCode), IsUnique = true)]
public class Subtask
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    /// <summary>Set when this subtask belongs to a WorkTask. Mutually exclusive with IssueId.</summary>
    public Guid? TaskId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(TaskId))]
    public WorkTask? Task { get; set; }

    /// <summary>Set when this subtask belongs to an Issue. Mutually exclusive with TaskId.</summary>
    public Guid? IssueId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(IssueId))]
    public Issue? Issue { get; set; }

    [Required]
    [MaxLength(20)]
    public required string SubtaskCode { get; set; }

    [Required]
    [MaxLength(200)]
    public required string Title { get; set; }

    public string? Description { get; set; }

    public required SubtaskState State { get; set; }

    public Guid? OwnerUserId { get; set; }

    [DeleteBehavior(DeleteBehavior.SetNull)]
    [ForeignKey(nameof(OwnerUserId))]
    public User? OwnerUser { get; set; }

    [Column(TypeName = "numeric(10,2)")]
    public required decimal EstimateHours { get; set; }

    [Column(TypeName = "numeric(10,2)")]
    public required decimal ToDoHours { get; set; }

    [Column(TypeName = "numeric(10,2)")]
    public required decimal ActualHours { get; set; }

    public DateOnly? DueDate { get; set; }

    public required DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }
}
