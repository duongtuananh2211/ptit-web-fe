using HorusVis.Data.Enums;
using HorusVis.Data.Horusvis.Entities;
using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Dao;

public sealed class UserSessionDao(HorusVisDbContext db) : IUserSessionDao
{
    public Task<UserSession?> FindActiveByTokenHashAsync(string tokenHash, CancellationToken ct)
        => db.Set<UserSession>()
            .FirstOrDefaultAsync(s => s.RefreshTokenHash == tokenHash && s.RevokedAt == null, ct);

    public Task<UserSession?> FindRevokedByTokenHashAsync(string tokenHash, CancellationToken ct)
        => db.Set<UserSession>()
            .FirstOrDefaultAsync(s => s.RefreshTokenHash == tokenHash && s.RevokedAt != null, ct);

    public async Task RevokeAllActiveSessionsForUserAsync(Guid userId, DateTimeOffset revokedAt, CancellationToken ct)
    {
        // Security-critical: persist immediately so revocations survive even if the caller throws.
        // This is the only DAO method that calls SaveChangesAsync directly.
        var sessions = await db.Set<UserSession>()
            .Where(s => s.UserId == userId && s.RevokedAt == null)
            .ToListAsync(ct);

        foreach (var session in sessions)
        {
            session.RevokedAt = revokedAt;
            session.Status = UserSessionStatus.Revoked;
        }

        await db.SaveChangesAsync(ct);
    }

    public void Add(UserSession session) => db.Set<UserSession>().Add(session);

    public Task<List<UserSession>> ListRecentAsync(int take, CancellationToken ct)
        => db.Set<UserSession>()
            .Include(s => s.User)
            .OrderByDescending(s => s.LastUsedAt)
            .Take(take)
            .ToListAsync(ct);

    public Task<UserSession?> FindByIdAsync(Guid id, CancellationToken ct)
        => db.Set<UserSession>().FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task RevokeByIdAsync(Guid sessionId, DateTimeOffset revokedAt, CancellationToken ct)
    {
        var session = await db.Set<UserSession>().FirstOrDefaultAsync(s => s.Id == sessionId, ct);
        if (session is null) return;
        session.RevokedAt = revokedAt;
        session.Status = UserSessionStatus.Revoked;
        await db.SaveChangesAsync(ct);
    }

    public Task<int> CountActiveAsync(CancellationToken ct)
        => db.Set<UserSession>().CountAsync(
            s => s.RevokedAt == null && s.RefreshTokenExpiresAt > DateTimeOffset.UtcNow, ct);
}
