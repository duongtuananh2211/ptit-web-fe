namespace HorusVis.Business.Models.Projects;

public sealed record ProjectDetailResponse(
    Guid                        Id,
    string                      ProjectKey,
    string                      ProjectName,
    string?                     Description,
    string                      Status,
    Guid                        OwnerUserId,
    string                      OwnerDisplayName,
    DateOnly?                   StartDate,
    DateOnly?                   EndDate,
    DateTime                    CreatedAt,
    IReadOnlyList<ProjectMemberDto>  Members,
    IReadOnlyList<FeatureAreaDto>    FeatureAreas
);
