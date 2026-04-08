namespace HorusVis.Core.Options;

public sealed class HorusVisOptions
{
    public const string SectionName = "HorusVis";

    public string ApplicationName { get; set; } = "HorusVis";

    public string FrontendOrigin { get; set; } = "http://localhost:5173";

    public bool UseInMemoryDatabaseWhenConnectionStringMissing { get; set; } = true;
}
