namespace HorusVis.Business.Models.Sprints;

public sealed record SprintDto(
    Guid     Id,
    string   SprintCode,
    DateOnly StartDate,
    DateOnly EndDate,
    string?  Goal,
    bool     IsCurrent
);
