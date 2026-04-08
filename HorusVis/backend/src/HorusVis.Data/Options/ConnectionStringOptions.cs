namespace HorusVis.Data.Options;

public class ConnectionStringOptions
{
    public required string Base { get; set; }

    public string? Host { get; set; }

    public string? Password { get; set; }

    public int? Port { get; set; }
}
