using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HorusVis.Data.Horusvis.Entities;

[Table("Roles")]
public class Role
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    [Required]
    [MaxLength(30)]
    public required string RoleCode { get; set; }

    [Required]
    [MaxLength(50)]
    public required string RoleName { get; set; }

    public string? Description { get; set; }
}
