namespace HorusVis.Business.Models.Projects;

public sealed class ProjectListFilter
{
    public string? Status     { get; set; }
    public string? Search     { get; set; }
    public int     PageNumber { get; set; } = 1;
    public int     PageSize   { get; set; } = 20;
}
