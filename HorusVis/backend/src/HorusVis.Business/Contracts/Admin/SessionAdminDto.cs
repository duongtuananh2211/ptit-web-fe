namespace HorusVis.Business.Contracts.Admin;

public sealed record SessionAdminDto(
    Guid Id,
    Guid UserId,
    string UserEmail,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastUsedAt,
    DateTimeOffset RefreshTokenExpiresAt,
    DateTimeOffset? RevokedAt,
    string DisplayStatus);
