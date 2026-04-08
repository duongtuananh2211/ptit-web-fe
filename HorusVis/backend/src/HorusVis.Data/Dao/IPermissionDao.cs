using HorusVis.Data.Horusvis.Entities;

namespace HorusVis.Data.Dao;

public interface IPermissionDao
{
    Task<List<Permission>> ListAllAsync(CancellationToken ct);
}
