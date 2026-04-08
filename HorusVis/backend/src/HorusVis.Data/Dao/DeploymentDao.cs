using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Dao;

public sealed class DeploymentDao(HorusVisDbContext db) : IDeploymentDao
{
    public Task<List<Deployment>> ListRecentAsync(int take, CancellationToken ct)
        => db.Set<Deployment>()
            .Include(d => d.TriggeredByUser)
            .OrderByDescending(d => d.StartedAt)
            .Take(take)
            .ToListAsync(ct);
}
