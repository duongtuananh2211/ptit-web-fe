using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HorusVis.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

[Table("TaskAssignees")]
public class TaskAssignee
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    public required Guid TaskId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(TaskId))]
    public WorkTask Task { get; set; } = null!;

    public required Guid UserId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public required AssignmentType AssignmentType { get; set; }

    public required DateTimeOffset AssignedAt { get; set; }
}
