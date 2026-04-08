using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

[Table("ReportSnapshots")]
public class ReportSnapshot
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    public Guid? ProjectId { get; set; }

    [DeleteBehavior(DeleteBehavior.SetNull)]
    [ForeignKey(nameof(ProjectId))]
    public Project? Project { get; set; }

    public required DateTimeOffset SnapshotDate { get; set; }

    public required int TotalActiveBugs { get; set; }

    [Column(TypeName = "numeric(10,2)")]
    public decimal? AvgTimeToCloseHours { get; set; }

    [Column(TypeName = "numeric(5,2)")]
    public decimal? TaskVelocityPercent { get; set; }

    public required int CriticalPriorityCount { get; set; }

    [Column(TypeName = "numeric(5,2)")]
    public decimal? EfficiencyPercent { get; set; }

    public int? CapacityUsed { get; set; }

    public int? CapacityTotal { get; set; }
}
