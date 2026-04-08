using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

[Table("FeatureAreas")]
public class FeatureArea
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    public required Guid ProjectId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(ProjectId))]
    public Project Project { get; set; } = null!;

    [Required]
    [MaxLength(30)]
    public required string AreaCode { get; set; }

    [Required]
    [MaxLength(100)]
    public required string AreaName { get; set; }

    [MaxLength(20)]
    public string? ColorHex { get; set; }

    public int? SortOrder { get; set; }
}
