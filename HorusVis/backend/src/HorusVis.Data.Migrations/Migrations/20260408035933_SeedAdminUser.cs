using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HorusVis.Data.Migrations.Migrations;

/// <inheritdoc />
[DbContext(typeof(HorusVisDbContext))]
[Migration("20260408035933_SeedAdminUser")]
public class SeedAdminUser : Migration
{
    private static readonly Guid AdminRoleId = new("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
    private static readonly Guid UserRoleId  = new("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");
    private static readonly Guid SuperAdminId = new("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");

    // BCrypt hash of "superadmin123" via ASP.NET Core Identity PasswordHasher (v3, PBKDF2-SHA256)
    private const string SuperAdminPasswordHash =
        "AQAAAAIAAYagAAAAEHbkz+3XorB8FQFMkkH1fGO0vxir4yy4x8Jb9aewsPxShUVYVE6JRbb8e29DGk5puw==";

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql($"""
            INSERT INTO horusvis."Roles" ("Id", "RoleCode", "RoleName", "Description") VALUES
            ('{AdminRoleId}', 'admin', 'Administrator', 'Full system access'),
            ('{UserRoleId}',  'user',  'User',          'Standard user access')
            ON CONFLICT DO NOTHING;

            INSERT INTO horusvis."Users" ("Id", "Username", "Email", "PasswordHash", "FullName", "RoleId", "Status", "CreatedAt") VALUES
            ('{SuperAdminId}', 'superadmin', 'superadmin@gmail.com', '{SuperAdminPasswordHash}', 'Super Admin', '{AdminRoleId}', 'Active', '2026-04-08T00:00:00+00:00')
            ON CONFLICT DO NOTHING;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql($"""
            DELETE FROM horusvis."Users" WHERE "Id" = '{SuperAdminId}';
            DELETE FROM horusvis."Roles" WHERE "Id" IN ('{AdminRoleId}', '{UserRoleId}');
            """);
        migrationBuilder.DeleteData(schema: "horusvis", table: "Roles",   keyColumn: "Id", keyValue: UserRoleId);
    }
}
