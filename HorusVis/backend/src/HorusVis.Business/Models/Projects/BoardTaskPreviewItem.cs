namespace HorusVis.Business.Models.Projects;

public sealed record BoardTaskPreviewItem(
    Guid    Id,
    string  Title,
    string  Priority,
    Guid?   AssigneeUserId
);
