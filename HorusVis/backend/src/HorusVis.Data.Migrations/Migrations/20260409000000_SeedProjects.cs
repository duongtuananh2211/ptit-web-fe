using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using HorusVis.Data.Persistence;

#nullable disable

namespace HorusVis.Data.Migrations.Migrations;

/// <inheritdoc />
[DbContext(typeof(HorusVisDbContext))]
[Migration("20260409000000_SeedProjects")]
public class SeedProjects : Migration
{
    // User IDs
    private static readonly Guid SuperAdminId = new("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");

    // Project IDs
    private static readonly Guid ProjectWebAppId = new("d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4");
    private static readonly Guid ProjectMobileId = new("e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5");
    private static readonly Guid ProjectDataEngineId = new("f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6");
    private static readonly Guid ProjectAuthServiceId = new("a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7");
    private static readonly Guid ProjectDocumentsId = new("b8b8b8b8-b8b8-b8b8-b8b8-b8b8b8b8b8b8");

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql($"""
            INSERT INTO horusvis."Projects" (
                "Id", 
                "ProjectKey", 
                "ProjectName", 
                "Description", 
                "OwnerUserId", 
                "Status", 
                "StartDate", 
                "EndDate", 
                "CreatedAt"
            ) VALUES
            (
                '{ProjectWebAppId}',
                'WEBAPP',
                'Web Application Platform',
                'Enterprise web application for internal management systems',
                '{SuperAdminId}',
                'Active',
                '2026-01-15',
                '2026-12-31',
                '2026-01-15T10:30:00+00:00'
            ),
            (
                '{ProjectMobileId}',
                'MOBILE',
                'Mobile App Development',
                'Cross-platform mobile application for iOS and Android',
                '{SuperAdminId}',
                'Active',
                '2026-02-01',
                '2026-09-30',
                '2026-02-01T08:00:00+00:00'
            ),
            (
                '{ProjectDataEngineId}',
                'DATAENG',
                'Data Processing Engine',
                'Big data pipeline and analytics processing system',
                '{SuperAdminId}',
                'OnHold',
                '2026-03-01',
                '2026-08-31',
                '2026-03-01T14:15:00+00:00'
            ),
            (
                '{ProjectAuthServiceId}',
                'AUTHSVC',
                'Authentication Service Upgrade',
                'Modernize authentication and authorization infrastructure',
                '{SuperAdminId}',
                'Draft',
                null,
                null,
                '2026-04-01T09:45:00+00:00'
            ),
            (
                '{ProjectDocumentsId}',
                'DOCS',
                'Documentation Portal',
                'Central repository for technical and user documentation',
                '{SuperAdminId}',
                'Active',
                '2025-06-01',
                '2026-05-31',
                '2025-06-01T11:20:00+00:00'
            )
            ON CONFLICT DO NOTHING;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql($"""
            DELETE FROM horusvis."Projects" WHERE "Id" IN (
                '{ProjectWebAppId}',
                '{ProjectMobileId}',
                '{ProjectDataEngineId}',
                '{ProjectAuthServiceId}',
                '{ProjectDocumentsId}'
            );
            """);
    }
}
