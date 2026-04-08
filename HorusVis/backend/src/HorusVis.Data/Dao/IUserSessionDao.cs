using HorusVis.Data.Horusvis.Entities;

namespace HorusVis.Data.Dao;

public interface IUserSessionDao
{
    Task<UserSession?> FindActiveByTokenHashAsync(string tokenHash, CancellationToken ct);
    Task<UserSession?> FindRevokedByTokenHashAsync(string tokenHash, CancellationToken ct);

    /// <summary>
    /// Revokes all active sessions for a user and immediately persists to the database.
    /// This is a security-critical operation — changes must commit even when the caller throws.
    /// </summary>
    Task RevokeAllActiveSessionsForUserAsync(Guid userId, DateTimeOffset revokedAt, CancellationToken ct);

    void Add(UserSession session);

    Task<List<UserSession>> ListRecentAsync(int take, CancellationToken ct);
    Task<UserSession?> FindByIdAsync(Guid id, CancellationToken ct);
    Task RevokeByIdAsync(Guid sessionId, DateTimeOffset revokedAt, CancellationToken ct);
    Task<int> CountActiveAsync(CancellationToken ct);
}
