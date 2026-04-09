using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

/// <summary>
/// Calendar sprint shared across the organisation.
/// 7 sprints per fiscal quarter (sprints 1-6 + IP); each sprint is exactly 14 days.
/// Fiscal year starts April 1. Current sprint is determined by comparing today against
/// StartDate/EndDate — no stored status.
///
/// Naming convention:
///   {YEAR}Q{Q}-{N}   e.g. 2026Q1-3
///   {YEAR}Q{Q}-IP    e.g. 2026Q1-IP  (sprint 7, innovation/planning)
/// </summary>
[Table("Sprints")]
[Index(nameof(SprintCode), IsUnique = true)]
public class Sprint
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    /// <summary>Human-readable code, e.g. "2026Q1-1", "2026Q2-IP".</summary>
    [Required]
    [MaxLength(20)]
    public required string SprintCode { get; set; }

    public required DateOnly StartDate { get; set; }

    public required DateOnly EndDate { get; set; }

    public string? Goal { get; set; }
}
