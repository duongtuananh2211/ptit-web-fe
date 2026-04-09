using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using System;
using System.Linq;

#nullable disable

namespace HorusVis.Data.Migrations.Migrations;

/// <inheritdoc />
[DbContext(typeof(HorusVisDbContext))]
[Migration("20260409042227_UpdateSprintDates")]
public class UpdateSprintDates : Migration
{
    // Q1 and Q2: 5 sprints + IP (6 total). Q3 and Q4: 5 sprints + sprint-6 + IP (7 total).
    // Grand total: 26 sprints. Each sprint = 14 days.
    private static readonly (string Code, string Start, string End)[] Sprints26 =
    [
        // Q1 (Jan 7 – Mar 31)  6 sprints
        ("2026Q1-1",  "2026-01-07", "2026-01-20"),
        ("2026Q1-2",  "2026-01-21", "2026-02-03"),
        ("2026Q1-3",  "2026-02-04", "2026-02-17"),
        ("2026Q1-4",  "2026-02-18", "2026-03-03"),
        ("2026Q1-5",  "2026-03-04", "2026-03-17"),
        ("2026Q1-IP", "2026-03-18", "2026-03-31"),
        // Q2 (Apr 1 – Jun 23)  6 sprints  -- 2026-04-09 is in Q2-1
        ("2026Q2-1",  "2026-04-01", "2026-04-14"),
        ("2026Q2-2",  "2026-04-15", "2026-04-28"),
        ("2026Q2-3",  "2026-04-29", "2026-05-12"),
        ("2026Q2-4",  "2026-05-13", "2026-05-26"),
        ("2026Q2-5",  "2026-05-27", "2026-06-09"),
        ("2026Q2-IP", "2026-06-10", "2026-06-23"),
        // Q3 (Jun 24 – Sep 29)  7 sprints
        ("2026Q3-1",  "2026-06-24", "2026-07-07"),
        ("2026Q3-2",  "2026-07-08", "2026-07-21"),
        ("2026Q3-3",  "2026-07-22", "2026-08-04"),
        ("2026Q3-4",  "2026-08-05", "2026-08-18"),
        ("2026Q3-5",  "2026-08-19", "2026-09-01"),
        ("2026Q3-6",  "2026-09-02", "2026-09-15"),
        ("2026Q3-IP", "2026-09-16", "2026-09-29"),
        // Q4 (Sep 30 – Jan 5, 2027)  7 sprints
        ("2026Q4-1",  "2026-09-30", "2026-10-13"),
        ("2026Q4-2",  "2026-10-14", "2026-10-27"),
        ("2026Q4-3",  "2026-10-28", "2026-11-10"),
        ("2026Q4-4",  "2026-11-11", "2026-11-24"),
        ("2026Q4-5",  "2026-11-25", "2026-12-08"),
        ("2026Q4-6",  "2026-12-09", "2026-12-22"),
        ("2026Q4-IP", "2026-12-23", "2027-01-05"),
    ];

    // Original 21 sprints from AddSprint (fiscal April-start, 7/quarter with sprint-6).
    private static readonly (string Code, string Start, string End)[] OriginalSprints21 =
    [
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
    ];

    private static string BuildInsert((string Code, string Start, string End)[] defs)
    {
        var values = string.Join(",\n            ", defs.Select(s =>
            $"('{Guid.NewGuid()}', '{s.Code}', '{s.Start}', '{s.End}')"));
        return $"""
            INSERT INTO horusvis."Sprints" ("Id", "SprintCode", "StartDate", "EndDate") VALUES
            {values}
            ON CONFLICT ("SprintCode") DO NOTHING;
            """;
    }

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // TRUNCATE CASCADE nulls out SprintId on Tasks/Issues automatically.
        migrationBuilder.Sql("""TRUNCATE TABLE horusvis."Sprints" CASCADE;""");

        migrationBuilder.Sql(BuildInsert(Sprints26));
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""TRUNCATE TABLE horusvis."Sprints" CASCADE;""");

        migrationBuilder.Sql(BuildInsert(OriginalSprints21));
    }
}
