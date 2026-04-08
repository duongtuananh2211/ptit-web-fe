using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Dao;

public sealed class UserDao(HorusVisDbContext db) : IUserDao
{
    public Task<User?> FindByUsernameOrEmailAsync(string usernameOrEmail, CancellationToken ct)
        => db.Set<User>()
            .Include(u => u.Role)
            .FirstOrDefaultAsync(
                u => u.Username == usernameOrEmail || u.Email == usernameOrEmail,
                ct);

    public Task<User?> FindByIdAsync(Guid id, CancellationToken ct)
        => db.Set<User>()
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<bool> ExistsByUsernameAsync(string username, CancellationToken ct)
        => db.Set<User>().AnyAsync(u => u.Username == username, ct);

    public Task<bool> ExistsByEmailAsync(string email, CancellationToken ct)
        => db.Set<User>().AnyAsync(u => u.Email == email, ct);

    public void Add(User user) => db.Set<User>().Add(user);

    public async Task<(List<User> Items, bool HasMore)> ListPageAsync(Guid? cursor, int pageSize, CancellationToken ct)
    {
        var query = db.Set<User>().Include(u => u.Role).AsQueryable();
        if (cursor.HasValue)
            query = query.Where(u => u.Id > cursor.Value);

        var items = await query.OrderBy(u => u.Id).Take(pageSize + 1).ToListAsync(ct);
        var hasMore = items.Count > pageSize;
        return (items.Take(pageSize).ToList(), hasMore);
    }

    public Task<int> CountActiveAsync(CancellationToken ct)
        => db.Set<User>().CountAsync(u => u.Status == Enums.UserStatus.Active, ct);
}
