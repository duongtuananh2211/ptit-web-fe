using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

[Table("IssueComments")]
public class IssueComment
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    public required Guid IssueId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(IssueId))]
    public Issue Issue { get; set; } = null!;

    public required Guid UserId { get; set; }

    [DeleteBehavior(DeleteBehavior.Restrict)]
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [Required]
    public required string Content { get; set; }

    public required DateTimeOffset CreatedAt { get; set; }
}
