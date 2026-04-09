namespace HorusVis.Business.Models.Projects;

public sealed record CreateProjectRequest(
    string    ProjectKey,
    string    ProjectName,
    string?   Description,
    DateOnly? StartDate,
    DateOnly? EndDate
);
