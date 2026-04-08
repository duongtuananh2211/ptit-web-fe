using HorusVis.Data.Horusvis.Entities;

namespace HorusVis.Data.Dao;

public interface IDeploymentDao
{
    Task<List<Deployment>> ListRecentAsync(int take, CancellationToken ct);
}
