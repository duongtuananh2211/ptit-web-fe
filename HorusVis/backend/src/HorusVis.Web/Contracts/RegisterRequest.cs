using System.ComponentModel.DataAnnotations;

namespace HorusVis.Web.Contracts;

public record RegisterRequest(
    [Required][MinLength(3)] string Username,
    [Required][EmailAddress] string Email,
    [Required] string FullName,
    [Required][MinLength(8)] string Password);
