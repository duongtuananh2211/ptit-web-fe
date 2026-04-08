using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HorusVis.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

[Table("Deployments")]
public class Deployment
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    [Required]
    [MaxLength(30)]
    public required string Environment { get; set; }

    [Required]
    [MaxLength(50)]
    public required string VersionLabel { get; set; }

    public required DateTimeOffset StartedAt { get; set; }

    public DateTimeOffset? FinishedAt { get; set; }

    public required DeploymentStatus Status { get; set; }

    public Guid? TriggeredByUserId { get; set; }

    [DeleteBehavior(DeleteBehavior.SetNull)]
    [ForeignKey(nameof(TriggeredByUserId))]
    public User? TriggeredByUser { get; set; }
}
