using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using System;
using System.Linq;

#nullable disable

namespace HorusVis.Data.Migrations.Migrations;

/// <inheritdoc />
[DbContext(typeof(HorusVisDbContext))]
[Migration("20260409000347_AddSprint")]
public class AddSprint : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "SprintId",
            schema: "horusvis",
            table: "Tasks",
            type: "uuid",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "SprintId",
            schema: "horusvis",
            table: "Issues",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateTable(
            name: "Sprints",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                SprintCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                Goal = table.Column<string>(type: "text", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Sprints", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Tasks_SprintId",
            schema: "horusvis",
            table: "Tasks",
            column: "SprintId");

        migrationBuilder.CreateIndex(
            name: "IX_Issues_SprintId",
            schema: "horusvis",
            table: "Issues",
            column: "SprintId");

        migrationBuilder.CreateIndex(
            name: "IX_Sprints_SprintCode",
            schema: "horusvis",
            table: "Sprints",
            column: "SprintCode",
            unique: true);

        migrationBuilder.AddForeignKey(
            name: "FK_Issues_Sprints_SprintId",
            schema: "horusvis",
            table: "Issues",
            column: "SprintId",
            principalSchema: "horusvis",
            principalTable: "Sprints",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);

        migrationBuilder.AddForeignKey(
            name: "FK_Tasks_Sprints_SprintId",
            schema: "horusvis",
            table: "Tasks",
            column: "SprintId",
            principalSchema: "horusvis",
            principalTable: "Sprints",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);

        // ── Seed: all sprints from 2026Q1 through 2026Q3 (21 sprints, 14 days each)
        // Fiscal year starts April 1.  Quarters: Q1=Apr, Q2=Jul, Q3=Oct
        // IP sprint (sprint 7) is the Innovation/Planning sprint — same 14-day length.
        var sprintDefs = new (string Code, string Start, string End)[]
        {
            ("2026Q1-1",  "2026-04-01", "2026-04-14"),
            ("2026Q1-2",  "2026-04-15", "2026-04-28"),
            ("2026Q1-3",  "2026-04-29", "2026-05-12"),
            ("2026Q1-4",  "2026-05-13", "2026-05-26"),
            ("2026Q1-5",  "2026-05-27", "2026-06-09"),
            ("2026Q1-6",  "2026-06-10", "2026-06-23"),
            ("2026Q1-IP", "2026-06-24", "2026-07-07"),
            ("2026Q2-1",  "2026-07-08", "2026-07-21"),
            ("2026Q2-2",  "2026-07-22", "2026-08-04"),
            ("2026Q2-3",  "2026-08-05", "2026-08-18"),
            ("2026Q2-4",  "2026-08-19", "2026-09-01"),
            ("2026Q2-5",  "2026-09-02", "2026-09-15"),
            ("2026Q2-6",  "2026-09-16", "2026-09-29"),
            ("2026Q2-IP", "2026-09-30", "2026-10-13"),
            ("2026Q3-1",  "2026-10-14", "2026-10-27"),
            ("2026Q3-2",  "2026-10-28", "2026-11-10"),
            ("2026Q3-3",  "2026-11-11", "2026-11-24"),
            ("2026Q3-4",  "2026-11-25", "2026-12-08"),
            ("2026Q3-5",  "2026-12-09", "2026-12-22"),
            ("2026Q3-6",  "2026-12-23", "2027-01-05"),
            ("2026Q3-IP", "2027-01-06", "2027-01-19"),
        };

        var values = string.Join(",\n                ", sprintDefs.Select(s =>
            $"('{Guid.NewGuid()}', '{s.Code}', '{s.Start}', '{s.End}')"));

        migrationBuilder.Sql($"""
            INSERT INTO horusvis."Sprints" ("Id", "SprintCode", "StartDate", "EndDate") VALUES
            {values}
            ON CONFLICT ("SprintCode") DO NOTHING;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DELETE FROM horusvis."Sprints"
            WHERE "SprintCode" LIKE '2026Q%';
            """);
        migrationBuilder.DropForeignKey(
            name: "FK_Issues_Sprints_SprintId",
            schema: "horusvis",
            table: "Issues");

        migrationBuilder.DropForeignKey(
            name: "FK_Tasks_Sprints_SprintId",
            schema: "horusvis",
            table: "Tasks");

        migrationBuilder.DropTable(
            name: "Sprints",
            schema: "horusvis");

        migrationBuilder.DropIndex(
            name: "IX_Tasks_SprintId",
            schema: "horusvis",
            table: "Tasks");

        migrationBuilder.DropIndex(
            name: "IX_Issues_SprintId",
            schema: "horusvis",
            table: "Issues");

        migrationBuilder.DropColumn(
            name: "SprintId",
            schema: "horusvis",
            table: "Tasks");

        migrationBuilder.DropColumn(
            name: "SprintId",
            schema: "horusvis",
            table: "Issues");
    }
}
