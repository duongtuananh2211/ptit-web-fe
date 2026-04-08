using System.ComponentModel.DataAnnotations;

namespace HorusVis.Web.Contracts;

public record LoginRequest(
    [Required] string UsernameOrEmail,
    [Required] string Password);
