using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

[Table("IssueSteps")]
public class IssueStep
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    public required Guid IssueId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(IssueId))]
    public Issue Issue { get; set; } = null!;

    public required int StepOrder { get; set; }

    [Required]
    public required string ActionText { get; set; }

    public string? ExpectedResult { get; set; }

    public string? ActualResult { get; set; }
}
