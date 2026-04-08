using HorusVis.Core.Options;
using HorusVis.Data.Dao;
using HorusVis.Data.Options;
using HorusVis.Data.Persistence;
using HorusVis.Data.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Npgsql;

namespace HorusVis.Data;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddHorusVisData(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<HorusVisOptions>()
            .Bind(configuration.GetSection(HorusVisOptions.SectionName));

        foreach (var section in configuration.GetSection("ConnectionStringParts").GetChildren())
        {
            services.Configure<ConnectionStringOptions>(section.Key, section);
        }

        services.TryAddSingleton<IConnectionStringFactory, ConnectionStringFactory>();

        var connectionStringBase = configuration["ConnectionStringParts:HorusVis:Base"];
        var hasConnectionString = !string.IsNullOrWhiteSpace(connectionStringBase);

        if (hasConnectionString)
        {
            services.TryAddSingleton(sp =>
            {
                var connectionStringFactory = sp.GetRequiredService<IConnectionStringFactory>();
                var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionStringFactory.GetConnectionString("HorusVis"));
                return dataSourceBuilder.Build();
            });
        }

        services.AddDbContext<HorusVisDbContext>((sp, options) =>
        {
            if (!hasConnectionString)
            {
                var horusVisOptions = sp.GetRequiredService<IOptions<HorusVisOptions>>().Value;
                if (!horusVisOptions.UseInMemoryDatabaseWhenConnectionStringMissing)
                {
                    throw new InvalidOperationException(
                        "ConnectionStringParts:HorusVis is required when the in-memory fallback is disabled.");
                }

                options.UseInMemoryDatabase("HorusVis.Scaffold");
                return;
            }

            options.UseNpgsql(
                sp.GetRequiredService<NpgsqlDataSource>(),
                o => o.MigrationsAssembly("HorusVis.Data.Migrations"));

            var extension = options.Options.FindExtension<HorusVisDbContextOptionsExtension>()
                ?? new HorusVisDbContextOptionsExtension();
            ((IDbContextOptionsBuilderInfrastructure) options).AddOrUpdateExtension(extension);
        });

        services.TryAddScoped<IUnitOfWorkService, UnitOfWorkService>();

        services.TryAddScoped<IUserDao, Dao.UserDao>();
        services.TryAddScoped<IUserSessionDao, Dao.UserSessionDao>();
        services.TryAddScoped<IRoleDao, Dao.RoleDao>();
        services.TryAddScoped<IPermissionDao, Dao.PermissionDao>();
        services.TryAddScoped<ISystemNodeDao, Dao.SystemNodeDao>();
        services.TryAddScoped<IDeploymentDao, Dao.DeploymentDao>();

        return services;
    }
}

