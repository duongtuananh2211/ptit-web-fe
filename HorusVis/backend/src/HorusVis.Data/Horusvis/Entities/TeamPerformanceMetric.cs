using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

[Table("TeamPerformanceMetrics")]
public class TeamPerformanceMetric
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    public required Guid SnapshotId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(SnapshotId))]
    public ReportSnapshot Snapshot { get; set; } = null!;

    public required Guid TeamId { get; set; }

    [DeleteBehavior(DeleteBehavior.Restrict)]
    [ForeignKey(nameof(TeamId))]
    public Team Team { get; set; } = null!;

    public required int CompletedPoints { get; set; }

    [Column(TypeName = "numeric(10,2)")]
    public decimal? CompletionSpeed { get; set; }
}
