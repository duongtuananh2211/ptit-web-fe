using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HorusVis.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

[Table("Recommendations")]
public class Recommendation
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    public required Guid SnapshotId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(SnapshotId))]
    public ReportSnapshot Snapshot { get; set; } = null!;

    public Guid? ProjectId { get; set; }

    [DeleteBehavior(DeleteBehavior.SetNull)]
    [ForeignKey(nameof(ProjectId))]
    public Project? Project { get; set; }

    [Required]
    [MaxLength(200)]
    public required string Title { get; set; }

    [Required]
    public required string Description { get; set; }

    [Required]
    [MaxLength(50)]
    public required string Source { get; set; }

    public required RecommendationStatus Status { get; set; }

    public Guid? AcceptedByUserId { get; set; }

    [DeleteBehavior(DeleteBehavior.SetNull)]
    [ForeignKey(nameof(AcceptedByUserId))]
    public User? AcceptedByUser { get; set; }

    public required DateTimeOffset CreatedAt { get; set; }
}
