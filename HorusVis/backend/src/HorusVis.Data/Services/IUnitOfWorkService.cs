namespace HorusVis.Data.Services;

/// <summary>
/// Saves all pending changes to the database.
/// </summary>
/// <remarks>
/// This is currently implemented as an EF Core flush.
/// However, the general pattern exists regardless.
/// It could be committing a transaction or flushing something else like NHibernate.
/// </remarks>
public interface IUnitOfWorkService
{
    Task FlushAsync(CancellationToken cancellationToken);

    void SubscribeOnFlushEventHandler(Func<CancellationToken, Task> onFlushHandler);
}
