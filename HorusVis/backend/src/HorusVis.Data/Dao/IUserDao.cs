using HorusVis.Data.Horusvis.Entities;

namespace HorusVis.Data.Dao;

public interface IUserDao
{
    Task<User?> FindByUsernameOrEmailAsync(string usernameOrEmail, CancellationToken ct);
    Task<User?> FindByIdAsync(Guid id, CancellationToken ct);
    Task<bool> ExistsByUsernameAsync(string username, CancellationToken ct);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken ct);
    void Add(User user);

    Task<(List<User> Items, bool HasMore)> ListPageAsync(Guid? cursor, int pageSize, CancellationToken ct);
    Task<int> CountActiveAsync(CancellationToken ct);
}
