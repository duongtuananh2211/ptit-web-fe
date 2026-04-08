using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HorusVis.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

[Table("IssueActivities")]
public class IssueActivity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    public required Guid IssueId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(IssueId))]
    public Issue Issue { get; set; } = null!;

    public required IssueActivityType ActivityType { get; set; }

    [MaxLength(50)]
    public string? FromValue { get; set; }

    [MaxLength(50)]
    public string? ToValue { get; set; }

    public string? Comment { get; set; }

    public required Guid ChangedByUserId { get; set; }

    [DeleteBehavior(DeleteBehavior.Restrict)]
    [ForeignKey(nameof(ChangedByUserId))]
    public User ChangedByUser { get; set; } = null!;

    public required DateTimeOffset ChangedAt { get; set; }
}
