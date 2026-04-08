using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

[Table("TaskComments")]
public class TaskComment
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    public required Guid TaskId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(TaskId))]
    public WorkTask Task { get; set; } = null!;

    public required Guid UserId { get; set; }

    [DeleteBehavior(DeleteBehavior.Restrict)]
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [Required]
    public required string Content { get; set; }

    public required DateTimeOffset CreatedAt { get; set; }
}
