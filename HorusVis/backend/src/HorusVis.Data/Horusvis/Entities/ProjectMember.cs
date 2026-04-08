using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HorusVis.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

[Table("ProjectMembers")]
public class ProjectMember
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    public required Guid ProjectId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(ProjectId))]
    public Project Project { get; set; } = null!;

    public required Guid UserId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public Guid? TeamId { get; set; }

    [DeleteBehavior(DeleteBehavior.SetNull)]
    [ForeignKey(nameof(TeamId))]
    public Team? Team { get; set; }

    [Required]
    [MaxLength(30)]
    public required string ProjectRole { get; set; }

    public required MemberStatus MemberStatus { get; set; }

    public required DateTimeOffset JoinedAt { get; set; }
}
