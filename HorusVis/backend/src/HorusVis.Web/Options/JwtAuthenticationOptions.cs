namespace HorusVis.Web.Options;

public sealed class JwtAuthenticationOptions
{
    public const string SectionName = "Authentication:Jwt";

    public string Issuer { get; set; } = "HorusVis";

    public string Audience { get; set; } = "HorusVis.Client";

    public string SigningKey { get; set; } = "HorusVis_Local_Development_Signing_Key_Change_Me_2026";

    public int TokenLifetimeMinutes { get; set; } = 480;
}
