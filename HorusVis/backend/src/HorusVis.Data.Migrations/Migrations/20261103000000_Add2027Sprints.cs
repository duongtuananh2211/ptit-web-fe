using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HorusVis.Data.Migrations.Migrations;

[DbContext(typeof(HorusVisDbContext))]
[Migration("20261103000000_Add2027Sprints")]
public sealed class Add2027Sprints : Migration
{
    // Continue the existing 14-day sprint calendar through the end of 2027.
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            INSERT INTO horusvis."Sprints" ("Id", "SprintCode", "StartDate", "EndDate") VALUES
            (gen_random_uuid(), '2027Q1-1',  '2027-01-06', '2027-01-19'),
            (gen_random_uuid(), '2027Q1-2',  '2027-01-20', '2027-02-02'),
            (gen_random_uuid(), '2027Q1-3',  '2027-02-03', '2027-02-16'),
            (gen_random_uuid(), '2027Q1-4',  '2027-02-17', '2027-03-02'),
            (gen_random_uuid(), '2027Q1-5',  '2027-03-03', '2027-03-16'),
            (gen_random_uuid(), '2027Q1-IP', '2027-03-17', '2027-03-30'),
            (gen_random_uuid(), '2027Q2-1',  '2027-03-31', '2027-04-13'),
            (gen_random_uuid(), '2027Q2-2',  '2027-04-14', '2027-04-27'),
            (gen_random_uuid(), '2027Q2-3',  '2027-04-28', '2027-05-11'),
            (gen_random_uuid(), '2027Q2-4',  '2027-05-12', '2027-05-25'),
            (gen_random_uuid(), '2027Q2-5',  '2027-05-26', '2027-06-08'),
            (gen_random_uuid(), '2027Q2-IP', '2027-06-09', '2027-06-22'),
            (gen_random_uuid(), '2027Q3-1',  '2027-06-23', '2027-07-06'),
            (gen_random_uuid(), '2027Q3-2',  '2027-07-07', '2027-07-20'),
            (gen_random_uuid(), '2027Q3-3',  '2027-07-21', '2027-08-03'),
            (gen_random_uuid(), '2027Q3-4',  '2027-08-04', '2027-08-17'),
            (gen_random_uuid(), '2027Q3-5',  '2027-08-18', '2027-08-31'),
            (gen_random_uuid(), '2027Q3-6',  '2027-09-01', '2027-09-14'),
            (gen_random_uuid(), '2027Q3-IP', '2027-09-15', '2027-09-28'),
            (gen_random_uuid(), '2027Q4-1',  '2027-09-29', '2027-10-12'),
            (gen_random_uuid(), '2027Q4-2',  '2027-10-13', '2027-10-26'),
            (gen_random_uuid(), '2027Q4-3',  '2027-10-27', '2027-11-09'),
            (gen_random_uuid(), '2027Q4-4',  '2027-11-10', '2027-11-23'),
            (gen_random_uuid(), '2027Q4-5',  '2027-11-24', '2027-12-07'),
            (gen_random_uuid(), '2027Q4-6',  '2027-12-08', '2027-12-21'),
            (gen_random_uuid(), '2027Q4-IP', '2027-12-22', '2028-01-04');
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DELETE FROM horusvis."Sprints"
            WHERE "SprintCode" LIKE '2027Q%';
            """);
    }
}
