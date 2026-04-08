# Adding EF Core Migrations

This guide follows the migration workflow used in Siren's database documentation, adapted to HorusVis.

## Prerequisites

1. Ensure the EF Core CLI tool is installed or updated:

   ```bash
   dotnet tool update --global dotnet-ef
   ```

1. Ensure HorusVis restores and builds successfully before generating a migration:

   ```bash
   cd backend
   dotnet restore HorusVis.sln
   dotnet build HorusVis.sln
   ```

## Add a Migration

1. Go to the `HorusVis.Data.Migrations` folder:

   ```bash
   cd backend/src/HorusVis.Data.Migrations
   ```

1. Create a new migration:

   ```bash
   dotnet ef migrations add MIGRATION_NAME
   ```

1. Replace `MIGRATION_NAME` with a name that describes the schema change.

Example:

```bash
cd backend/src/HorusVis.Data.Migrations
dotnet ef migrations add AddWorkItemIndexes
```

## Cleanup the Generated Files

After generating the migration, clean up the output to match the style used by Siren's guideline.

1. Move the migration attributes from `yyyyMMddHHmmss_MIGRATION_NAME.Designer.cs` into `yyyyMMddHHmmss_MIGRATION_NAME.cs`.
1. Delete `yyyyMMddHHmmss_MIGRATION_NAME.Designer.cs`.
1. Remove unnecessary `using` statements.
1. Switch the namespace to file-scoped namespace style if needed.

If the team later chooses to keep EF's default generated file layout, update this document accordingly and skip the cleanup step.

## Modify the Migration

After scaffolding the files:

1. Review the generated `Up` and `Down` methods.
1. Adjust indexes, constraints, default values, data fixes, or SQL statements as necessary.
1. Verify the rollback path in `Down` is correct, not only the forward path in `Up`.

## Test the Migration Locally

After creating the migration, test it locally.

Apply migrations:

```bash
cd backend/src/HorusVis.Data.Migrations
dotnet ef database update
```

This workflow is also referenced from [RunningLocally.md](RunningLocally.md).

## Remove the Last Migration

If the last migration has not been applied yet and you want to discard it:

```bash
cd backend/src/HorusVis.Data.Migrations
dotnet ef migrations remove
```

## Roll Back the Database

To roll the database back to the initial empty state:

```bash
cd backend/src/HorusVis.Data.Migrations
dotnet ef database update 0
```

To roll back to a specific migration:

```bash
cd backend/src/HorusVis.Data.Migrations
dotnet ef migrations list --startup-project ../HorusVis.Web
dotnet ef database update MIGRATION_NAME --startup-project ../HorusVis.Web
```

Replace `MIGRATION_NAME` with the exact migration identifier you want to keep applied.

## Notes for HorusVis

- The migrations assembly is `HorusVis.Data.Migrations`.
- The runtime startup project is `HorusVis.Web`.
- The DbContext is `HorusVisDbContext`.
- The design-time factory reads `ConnectionStrings:HorusVis` from `HorusVis.Web` configuration instead of hardcoding it in code.
- The default local development appsettings currently use `Host=localhost;Port=5432;Database=horusvis;Username=postgres;Password=postgres`.
- No committed migrations exist yet in the current scaffold.
