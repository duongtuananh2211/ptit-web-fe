using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HorusVis.Data.Enums;

namespace HorusVis.Data.Horusvis.Entities;

[Table("SystemNodes")]
public class SystemNode
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public required string NodeName { get; set; }

    [Required]
    [MaxLength(30)]
    public required string Environment { get; set; }

    [Column(TypeName = "numeric(5,2)")]
    public decimal? CpuLoadPercent { get; set; }

    [Column(TypeName = "numeric(5,2)")]
    public decimal? MemoryLoadPercent { get; set; }

    public required NodeStatus Status { get; set; }

    public DateTimeOffset? LastHeartbeatAt { get; set; }
}
