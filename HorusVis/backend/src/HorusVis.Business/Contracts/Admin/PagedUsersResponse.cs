namespace HorusVis.Business.Contracts.Admin;

public sealed record PagedUsersResponse(
    List<UserAdminDto> Data,
    string? NextCursor,
    bool HasMore);
