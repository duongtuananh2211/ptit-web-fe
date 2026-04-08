using HorusVis.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace HorusVis.Data.Migrations;

public static class Program
{
    public static void Main(string[] args)
    {
        var hostBuilder = CreateHostBuilder(args);
        using var host = hostBuilder.Build();
        host.Run();
    }

    // EF Core uses this method at design time to access the DbContext
    public static IHostBuilder CreateHostBuilder(string[] args)
    {
        var hostBuilder = Host.CreateDefaultBuilder(args)
            .ConfigureAppConfiguration(ConfigureApp);

        hostBuilder.ConfigureServices((hostBuilderContext, serviceCollection) =>
        {
            serviceCollection.AddHorusVisData(hostBuilderContext.Configuration);
        });
        return hostBuilder;
    }

    private static void ConfigureApp(HostBuilderContext hostContext, IConfigurationBuilder configuration)
    {
        var environment = hostContext.HostingEnvironment.EnvironmentName;
        configuration.AddJsonFile("appsettings.json");
        configuration.AddJsonFile($"appsettings.{environment}.json", optional: true);
    }
}
