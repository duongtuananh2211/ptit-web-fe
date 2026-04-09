namespace HorusVis.Business.Models.Projects;

public sealed record UpdateProjectRequest(
    string    ProjectName,
    string?   Description,
    string    Status,
    DateOnly? StartDate,
    DateOnly? EndDate
);
