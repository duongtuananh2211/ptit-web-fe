using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Dao;

public sealed class SystemNodeDao(HorusVisDbContext db) : ISystemNodeDao
{
    public Task<List<SystemNode>> ListAllAsync(CancellationToken ct)
        => db.Set<SystemNode>().OrderBy(n => n.NodeName).ToListAsync(ct);
}
