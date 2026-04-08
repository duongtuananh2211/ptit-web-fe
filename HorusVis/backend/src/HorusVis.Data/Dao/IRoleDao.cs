using HorusVis.Data.Horusvis.Entities;

namespace HorusVis.Data.Dao;

public interface IRoleDao
{
    Task<Role?> FindByRoleCodeAsync(string roleCode, CancellationToken ct);
    Task<List<Role>> ListAllAsync(CancellationToken ct);
    Task<Role?> FindByIdAsync(Guid id, CancellationToken ct);
    Task<List<Role>> ListAllWithPermissionsAsync(CancellationToken ct);
    Task RemoveAllPermissionsAsync(Guid roleId, CancellationToken ct);
    void AddPermission(RolePermission rp);
}
