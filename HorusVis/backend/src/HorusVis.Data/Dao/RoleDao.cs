using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Dao;

public sealed class RoleDao(HorusVisDbContext db) : IRoleDao
{
    public Task<Role?> FindByRoleCodeAsync(string roleCode, CancellationToken ct)
        => db.Set<Role>()
            .FirstOrDefaultAsync(r => r.RoleCode.ToLower() == roleCode.ToLower(), ct);

    public Task<List<Role>> ListAllAsync(CancellationToken ct)
        => db.Set<Role>().OrderBy(r => r.RoleName).ToListAsync(ct);

    public Task<Role?> FindByIdAsync(Guid id, CancellationToken ct)
        => db.Set<Role>().FirstOrDefaultAsync(r => r.Id == id, ct);

    public Task<List<Role>> ListAllWithPermissionsAsync(CancellationToken ct)
        => db.Set<Role>()
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .OrderBy(r => r.RoleName)
            .ToListAsync(ct);

    public async Task RemoveAllPermissionsAsync(Guid roleId, CancellationToken ct)
    {
        var existing = await db.Set<RolePermission>()
            .Where(rp => rp.RoleId == roleId)
            .ToListAsync(ct);
        db.Set<RolePermission>().RemoveRange(existing);
    }

    public void AddPermission(RolePermission rp) => db.Set<RolePermission>().Add(rp);
}
