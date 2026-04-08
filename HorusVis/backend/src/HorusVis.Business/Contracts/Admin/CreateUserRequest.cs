using System.ComponentModel.DataAnnotations;

namespace HorusVis.Business.Contracts.Admin;

public sealed record CreateUserRequest(
    [Required][MaxLength(50)] string Username,
    [Required][EmailAddress]  string Email,
    [Required]                string FullName,
    [Required][MinLength(8)]  string Password,
    [Required]                string RoleCode);
