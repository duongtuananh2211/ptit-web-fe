# Projects Table Data Dump

## Overview
This document describes the seed data created for the `Projects` table in the HorusVis database.

## Files Created

### 1. Migration File
**Location**: `HorusVis.Data.Migrations/Migrations/20260409000000_SeedProjects.cs`
- EF Core migration file that can be applied via `dotnet ef database update`
- Includes both `Up()` and `Down()` methods for rollback capability
- Uses PostgreSQL `ON CONFLICT DO NOTHING` to prevent duplicate inserts

### 2. SQL Dump File
**Location**: `docs/sql/SeedProjects.sql`
- Standalone SQL script for direct database execution
- Includes verification queries and statistics
- Can be executed directly in pgAdmin or psql

## Sample Data

### Projects Included (5 Total)

| Project Key | Project Name | Status | Owner | Start Date | End Date | Purpose |
|---|---|---|---|---|---|---|
| **WEBAPP** | Web Application Platform | Active | SuperAdmin | 2026-01-15 | 2026-12-31 | Enterprise web app for internal management |
| **MOBILE** | Mobile App Development | Active | SuperAdmin | 2026-02-01 | 2026-09-30 | Cross-platform iOS/Android application |
| **DATAENG** | Data Processing Engine | OnHold | SuperAdmin | 2026-03-01 | 2026-08-31 | Big data pipeline and analytics system |
| **AUTHSVC** | Authentication Service Upgrade | Draft | SuperAdmin | NULL | NULL | Modernize auth infrastructure |
| **DOCS** | Documentation Portal | Active | SuperAdmin | 2025-06-01 | 2026-05-31 | Technical & user documentation hub |

### Status Distribution
- **Active**: 3 projects (WEBAPP, MOBILE, DOCS)
- **OnHold**: 1 project (DATAENG)
- **Draft**: 1 project (AUTHSVC)
- **Archived**: 0 projects

## Project GUIDs

```
WEBAPP:    d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4
MOBILE:    e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5
DATAENG:   f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6
AUTHSVC:   a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7
DOCS:      b8b8b8b8-b8b8-b8b8-b8b8-b8b8b8b8b8b8
```

## How to Apply

### Option 1: Using EF Core Migration
```powershell
cd HorusVis/backend/src/HorusVis.Data.Migrations
dotnet ef database update -c HorusVisDbContext
```

### Option 2: Direct SQL Execution
```bash
# Using psql
psql -h 10.10.30.26 -d horusvis -U postgres -f docs/sql/SeedProjects.sql

# Using pgAdmin
# Copy and paste the SQL from SeedProjects.sql into the Query Tool
```

## Column Description

| Column | Type | Description |
|---|---|---|
| `Id` | UUID (PK) | Unique identifier for project |
| `ProjectKey` | VARCHAR(20) | Unique project code (e.g., "WEBAPP") |
| `ProjectName` | VARCHAR(150) | Display name of the project |
| `Description` | TEXT (nullable) | Detailed project description |
| `OwnerUserId` | UUID (FK) | References Users table - project owner |
| `Status` | ENUM | Draft, Active, OnHold, Archived |
| `StartDate` | DATE (nullable) | Project start date |
| `EndDate` | DATE (nullable) | Project end date |
| `CreatedAt` | TIMESTAMP WITH TZ | Record creation time |

## Notes

- All projects are owned by the **SuperAdmin** user (ID: c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3)
- The migration ensures no duplicates via `ON CONFLICT DO NOTHING`
- ProjectKey values are unique (DB constraint enforced)
- Dates are in ISO format (YYYY-MM-DD)
- Timestamps use UTC timezone (+00:00)
- The Draft project (AUTHSVC) has NULL values for StartDate and EndDate (not yet scheduled)

## To Rollback

```powershell
dotnet ef migrations remove -c HorusVisDbContext
```

Or if using the SQL directly, delete rows manually and re-run migrations to restore schema.
