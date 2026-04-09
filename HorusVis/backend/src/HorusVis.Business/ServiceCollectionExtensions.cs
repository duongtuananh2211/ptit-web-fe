using HorusVis.Business.Contracts;
using HorusVis.Business.Services;
using HorusVis.Data.Horusvis.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace HorusVis.Business;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddHorusVisBusiness(this IServiceCollection services)
    {
        services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();
        services.AddScoped<IPasswordService, PasswordService>();
        services.AddSingleton<IRefreshTokenService, RefreshTokenService>();

        services.AddScoped<IAuthenticationService, AuthenticationService>();
        services.AddScoped<IProjectsService, ProjectsService>();
        services.AddScoped<IProjectMembersService, ProjectMembersService>();
        services.AddScoped<IFeatureAreasService, FeatureAreasService>();
        services.AddScoped<ISprintsService, SprintsService>();
        services.AddScoped<IMyTasksService, MyTasksService>();
        services.AddScoped<IRecommendationService, RecommendationService>();
        services.AddScoped<IReportExportService, ReportExportService>();
        services.AddScoped<IReportsService, ReportsService>();
        services.AddScoped<IAdministrationService, AdministrationService>();

        return services;
    }
}
