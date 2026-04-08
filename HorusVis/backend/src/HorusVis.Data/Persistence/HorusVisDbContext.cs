using HorusVis.Data.Enums;
using HorusVis.Data.Services;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Persistence;

public sealed class HorusVisDbContext(DbContextOptions<HorusVisDbContext> options) : DbContext(options)
{
    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Conventions.Add(_ => new FindAllModelsConvention());
        configurationBuilder.Properties<DateTimeOffset>().HaveConversion<DateTimeOffsetConverter>();

        // Store all enums as their string name in the database (matches VARCHAR columns in the schema)
        configurationBuilder.Properties<UserStatus>().HaveConversion<string>();
        configurationBuilder.Properties<UserSessionStatus>().HaveConversion<string>();
        configurationBuilder.Properties<ProjectStatus>().HaveConversion<string>();
        configurationBuilder.Properties<WorkTaskStatus>().HaveConversion<string>();
        configurationBuilder.Properties<WorkTaskPriority>().HaveConversion<string>();
        configurationBuilder.Properties<IssueSeverity>().HaveConversion<string>();
        configurationBuilder.Properties<IssueStatus>().HaveConversion<string>();
        configurationBuilder.Properties<IssueWorkflowStage>().HaveConversion<string>();
        configurationBuilder.Properties<IssueActivityType>().HaveConversion<string>();
        configurationBuilder.Properties<SubtaskState>().HaveConversion<string>();
        configurationBuilder.Properties<AssignmentType>().HaveConversion<string>();
        configurationBuilder.Properties<MemberStatus>().HaveConversion<string>();
        configurationBuilder.Properties<RecommendationStatus>().HaveConversion<string>();
        configurationBuilder.Properties<DeploymentStatus>().HaveConversion<string>();
        configurationBuilder.Properties<NodeStatus>().HaveConversion<string>();
        configurationBuilder.Properties<NotificationType>().HaveConversion<string>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(HorusVisDbContext).Assembly);
    }
}
