using System.Collections.Concurrent;
using HorusVis.Data.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;

namespace HorusVis.Data.Services;

internal sealed class ConnectionStringFactory : IConnectionStringFactory
{
    private readonly ConcurrentDictionary<string, string> ConnectionStringCache = new();

    private readonly ILogger _logger;

    private readonly IOptionsMonitor<ConnectionStringOptions> _connectionStringAccessor;

    public ConnectionStringFactory(ILogger<ConnectionStringFactory> logger, IOptionsMonitor<ConnectionStringOptions> connectionStringAccessor)
    {
        _logger = logger;
        _connectionStringAccessor = connectionStringAccessor;

        // don't need to dispose this since it's lifetime of class
        _connectionStringAccessor.OnChange(InvalidateConnectionString);
    }

    public string GetConnectionString(string name) => ConnectionStringCache.GetOrAdd(name, GenerateConnectionString);

    private void InvalidateConnectionString(ConnectionStringOptions connectionStringOptions, string? name)
    {
        if (name == null)
        {
            return;
        }

        if (ConnectionStringCache.TryRemove(name, out _))
        {
            _logger.LogInformation("Invalidated credentials for connection string {ConnectionStringInfo}.", name);
        }
    }

    // the general expectation is that the connection string is... well... a string
    // but we get parts of it from multiple sources
    private string GenerateConnectionString(string name)
    {
        var connectionStringInfo = _connectionStringAccessor.Get(name);
        if (connectionStringInfo == null)
        {
            throw new ArgumentOutOfRangeException(nameof(name), "Unable to find connection string info in the configuration.");
        }

        var connectionStringBuilder = new NpgsqlConnectionStringBuilder
        {
            ConnectionString = connectionStringInfo.Base
        };

        if (connectionStringInfo.Host != null)
        {
            connectionStringBuilder.Host = connectionStringInfo.Host;
        }

        if (connectionStringInfo.Password != null)
        {
            connectionStringBuilder.Password = connectionStringInfo.Password;
        }

        if (connectionStringInfo.Port != null)
        {
            connectionStringBuilder.Port = connectionStringInfo.Port.Value;
        }

        var connectionString = connectionStringBuilder.ConnectionString;
        if (string.IsNullOrEmpty(connectionString))
        {
            throw new ArgumentOutOfRangeException(nameof(name), $"There is no configuration for the connection string '{name}'.");
        }

        return connectionString;
    }
}
