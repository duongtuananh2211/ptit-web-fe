using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Dao;

public sealed class PermissionDao(HorusVisDbContext db) : IPermissionDao
{
    public Task<List<Permission>> ListAllAsync(CancellationToken ct)
        => db.Set<Permission>().OrderBy(p => p.Scope).ToListAsync(ct);
}
