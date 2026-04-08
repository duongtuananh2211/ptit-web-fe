using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HorusVis.Data.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class AddRoleIsSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSystem",
                schema: "horusvis",
                table: "Roles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql("""
                UPDATE horusvis."Roles" SET "IsSystem" = true
                WHERE "RoleCode" IN ('admin', 'user');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSystem",
                schema: "horusvis",
                table: "Roles");
        }
    }
}
