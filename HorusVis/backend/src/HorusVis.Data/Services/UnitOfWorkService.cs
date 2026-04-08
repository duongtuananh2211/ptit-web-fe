using System.Collections.Concurrent;
using HorusVis.Data.Persistence;

namespace HorusVis.Data.Services;

internal sealed class UnitOfWorkService : IUnitOfWorkService
{
    internal static ConcurrentDictionary<Guid, ConcurrentBag<(int Lease, Func<CancellationToken, Task> Task)>> OnFlushEventHandler = new();

    private readonly HorusVisDbContext _context;

    public UnitOfWorkService(HorusVisDbContext context)
    {
        _context = context;
    }

    public async Task FlushAsync(CancellationToken cancellationToken)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }

    public void SubscribeOnFlushEventHandler(Func<CancellationToken, Task> sendAsync)
    {
        var eventHandlers = OnFlushEventHandler.GetOrAdd(_context.ContextId.InstanceId, _ => new ConcurrentBag<(int, Func<CancellationToken, Task>)>());
        eventHandlers.Add((_context.ContextId.Lease, sendAsync));
    }
}
