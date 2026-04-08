using HorusVis.Data.Horusvis.Entities;

namespace HorusVis.Data.Dao;

public interface ISystemNodeDao
{
    Task<List<SystemNode>> ListAllAsync(CancellationToken ct);
}
