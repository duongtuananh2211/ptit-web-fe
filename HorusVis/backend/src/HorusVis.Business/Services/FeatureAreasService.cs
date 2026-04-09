using HorusVis.Business.Contracts;
using HorusVis.Business.Models.Projects;
using HorusVis.Data.Persistence;
using HorusVis.Data.Horusvis.Entities;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Business.Services;

public sealed class FeatureAreasService(HorusVisDbContext dbContext) : IFeatureAreasService
{
    public async Task<IReadOnlyList<FeatureAreaDto>> GetFeatureAreasAsync(Guid projectId, Guid callerId, CancellationToken ct = default)
    {
        await EnsureProjectExistsAsync(projectId, ct);

        return await dbContext.Set<FeatureArea>()
            .Where(a => a.ProjectId == projectId)
            .OrderBy(a => a.SortOrder)
            .Select(a => new FeatureAreaDto(a.Id, a.AreaCode, a.AreaName, a.ColorHex, a.SortOrder))
            .ToListAsync(ct);
    }

    public async Task<FeatureAreaDto> CreateFeatureAreaAsync(Guid projectId, CreateFeatureAreaRequest request, Guid callerId, CancellationToken ct = default)
    {
        await EnsureCallerIsOwnerAsync(projectId, callerId, ct);

        var duplicate = await dbContext.Set<FeatureArea>()
            .AnyAsync(a => a.ProjectId == projectId && a.AreaCode == request.AreaCode, ct);

        if (duplicate)
            throw new InvalidOperationException($"Feature area code '{request.AreaCode}' already exists in this project.");

        var area = new FeatureArea
        {
            Id        = Guid.NewGuid(),
            ProjectId = projectId,
            AreaCode  = request.AreaCode,
            AreaName  = request.AreaName,
            ColorHex  = request.ColorHex,
            SortOrder = request.SortOrder,
        };

        dbContext.Set<FeatureArea>().Add(area);
        await dbContext.SaveChangesAsync(ct);

        return new FeatureAreaDto(area.Id, area.AreaCode, area.AreaName, area.ColorHex, area.SortOrder);
    }

    public async Task DeleteFeatureAreaAsync(Guid projectId, Guid areaId, Guid callerId, CancellationToken ct = default)
    {
        await EnsureCallerIsOwnerAsync(projectId, callerId, ct);

        var area = await dbContext.Set<FeatureArea>()
            .FirstOrDefaultAsync(a => a.Id == areaId && a.ProjectId == projectId, ct)
            ?? throw new KeyNotFoundException($"Feature area {areaId} not found in project {projectId}.");

        dbContext.Set<FeatureArea>().Remove(area);
        await dbContext.SaveChangesAsync(ct);
    }

    // ─── private helpers ───────────────────────────────────────────────────────

    private async Task EnsureProjectExistsAsync(Guid projectId, CancellationToken ct)
    {
        var exists = await dbContext.Set<Project>().AnyAsync(p => p.Id == projectId, ct);
        if (!exists)
            throw new KeyNotFoundException($"Project {projectId} not found.");
    }

    private async Task EnsureCallerIsOwnerAsync(Guid projectId, Guid callerId, CancellationToken ct)
    {
        var project = await dbContext.Set<Project>()
            .FirstOrDefaultAsync(p => p.Id == projectId, ct)
            ?? throw new KeyNotFoundException($"Project {projectId} not found.");

        if (project.OwnerUserId != callerId)
            throw new UnauthorizedAccessException("Only the project owner can manage feature areas.");
    }
}
