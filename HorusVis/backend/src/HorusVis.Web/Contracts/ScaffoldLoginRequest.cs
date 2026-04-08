namespace HorusVis.Web.Contracts;

public sealed class ScaffoldLoginRequest
{
    public string? UserId { get; set; }

    public string? UserName { get; set; }

    public string? Email { get; set; }

    public string[]? Roles { get; set; }
}
