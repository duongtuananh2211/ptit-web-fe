namespace HorusVis.Business.Models.Projects;

public sealed record BoardColumnDto(
    string                              Status,
    int                                 TaskCount,
    IReadOnlyList<BoardTaskPreviewItem> Tasks
);
