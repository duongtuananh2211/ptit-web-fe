using HorusVis.Business.Models.Projects;

namespace HorusVis.Business.Contracts;

public interface IFeatureAreasService
{
    Task<IReadOnlyList<FeatureAreaDto>> GetFeatureAreasAsync(Guid projectId, Guid callerId, CancellationToken ct = default);
    Task<FeatureAreaDto>                CreateFeatureAreaAsync(Guid projectId, CreateFeatureAreaRequest request, Guid callerId, CancellationToken ct = default);
    Task                                DeleteFeatureAreaAsync(Guid projectId, Guid areaId, Guid callerId, CancellationToken ct = default);
}
