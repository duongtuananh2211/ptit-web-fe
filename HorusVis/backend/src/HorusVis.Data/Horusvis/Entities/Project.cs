using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HorusVis.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

[Table("Projects")]
[Index(nameof(ProjectKey), IsUnique = true)]
public class Project
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    [Required]
    [MaxLength(20)]
    public required string ProjectKey { get; set; }

    [Required]
    [MaxLength(150)]
    public required string ProjectName { get; set; }

    public string? Description { get; set; }

    public required Guid OwnerUserId { get; set; }

    [DeleteBehavior(DeleteBehavior.Restrict)]
    [ForeignKey(nameof(OwnerUserId))]
    public User OwnerUser { get; set; } = null!;

    public required ProjectStatus Status { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public required DateTimeOffset CreatedAt { get; set; }
}
