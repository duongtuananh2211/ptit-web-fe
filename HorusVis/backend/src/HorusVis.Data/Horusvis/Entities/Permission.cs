using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

[Table("Permissions")]
[Index(nameof(Scope), IsUnique = true)]
public class Permission
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Scope { get; set; }

    public string? Description { get; set; }
}
