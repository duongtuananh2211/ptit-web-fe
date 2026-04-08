# Database

HorusVis is currently scaffolded around PostgreSQL and EF Core migrations.

For local runtime, HorusVis also supports an in-memory fallback when `ConnectionStrings:HorusVis` is empty and `UseInMemoryDatabaseWhenConnectionStringMissing` is enabled.

For design-time EF Core migration commands, HorusVis does not use a hardcoded connection string anymore. The migrations factory reads `ConnectionStrings:HorusVis` from `HorusVis.Web` configuration.

## Local Defaults

The current scaffold uses these local PostgreSQL defaults in the design-time DbContext factory:

| Parameter | Value |
| --------- | ----- |
| Host | `localhost` |
| Port | `5432` |
| Database | `horusvis` |
| Username | `postgres` |
| Password | `postgres` |

## EF Core Workflow

Use the following docs for day-to-day database work:

- [AddMigrations.md](../development/AddMigrations.md)
- [RunningLocally.md](../development/RunningLocally.md)

## Current Scope

At the moment:

- HorusVis has a scaffold `HorusVisDbContext`
- HorusVis has a separate `HorusVis.Data.Migrations` project
- HorusVis does not yet have committed migrations in the repository
- HorusVis does not yet have Siren-style deployment automation for migrations
