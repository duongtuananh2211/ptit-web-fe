using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

[Table("ReportBugDensityItems")]
public class ReportBugDensityItem
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    public required Guid SnapshotId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(SnapshotId))]
    public ReportSnapshot Snapshot { get; set; } = null!;

    public required Guid FeatureAreaId { get; set; }

    [DeleteBehavior(DeleteBehavior.Restrict)]
    [ForeignKey(nameof(FeatureAreaId))]
    public FeatureArea FeatureArea { get; set; } = null!;

    public required int BugCount { get; set; }

    [Column(TypeName = "numeric(5,2)")]
    public decimal? BugPercent { get; set; }
}
