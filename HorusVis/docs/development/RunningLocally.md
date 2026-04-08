# Running HorusVis Locally

This guide follows the spirit of Siren's local setup documentation, but it is adapted to the current HorusVis scaffold.

Unlike Siren, HorusVis currently does not include:

- `scripts/`
- `automation/`
- `infrastructure/`
- non-prod database copy workflows

That means local setup is intentionally lightweight and manual.

## Prerequisites

Install the following before starting:

1. .NET 10 SDK
1. Node.js and `npm`
1. A trusted local HTTPS developer certificate

For HTTPS development on Windows or macOS:

```bash
dotnet dev-certs https --trust
```

Optional tools:

1. Docker Desktop, if you want a local PostgreSQL instance
1. `dotnet-ef`, if you want to work with future EF Core migrations

```bash
dotnet tool install --global dotnet-ef
```

## Quick Start Without a Database

The current scaffold can run without PostgreSQL.

If `ConnectionStrings:HorusVis` is empty, the backend falls back to an EF Core in-memory database.

### 1. Run the backend

From the repository root:

```bash
cd backend
dotnet restore HorusVis.sln
dotnet run --project src/HorusVis.Web --launch-profile https
```

Notes:

- The HTTPS launch profile uses `https://localhost:7235`
- The HTTP endpoint `http://localhost:5049` is redirected to HTTPS
- `launchSettings.json` already sets `ASPNETCORE_ENVIRONMENT=Development` for this profile

### 2. Run the frontend

In a separate terminal:

```bash
cd frontend/horusvis-react
npm install
copy .env.example .env
npm run dev
```

If you are not using Windows shell commands, create `.env` manually from `.env.example`.

The frontend expects the API at:

```bash
VITE_API_BASE_URL=https://localhost:7235
```

Vite runs locally at:

```text
http://localhost:5173
```

## Sanity Checks

Once both processes are running, verify these URLs:

### Backend

- `https://localhost:7235/health`
- `https://localhost:7235/`
- `https://localhost:7235/swagger`
- `https://localhost:7235/api/auth/placeholder`
- `https://localhost:7235/api/projects/placeholder`
- `https://localhost:7235/api/my-tasks/placeholder`
- `https://localhost:7235/api/reports/placeholder`
- `https://localhost:7235/api/admin/placeholder`

## Swagger and Authentication

In Development, Swagger UI is available at:

```text
https://localhost:7235/swagger
```

The current scaffold now supports local JWT bearer authentication so you can add `[Authorize]` to controllers and still test them locally.

### Get a local development token

Example login request:

```bash
curl -k -X POST https://localhost:7235/api/auth/login \
	-H "Content-Type: application/json" \
	-d '{"userName":"vu.nguyen","email":"vu.nguyen@example.com","roles":["Admin"]}'
```

The response includes an `accessToken`.

### Use the token in Swagger

1. Open `https://localhost:7235/swagger`
1. Run `POST /api/auth/login`
1. Copy the `accessToken`
1. Click `Authorize`
1. Paste `Bearer YOUR_TOKEN`
1. Call protected endpoints such as `/api/projects/placeholder` or `/api/admin/placeholder`

Notes:

- `Projects`, `My Tasks`, and `Reports` placeholder controllers now require authentication
- `Admin` placeholder controller now requires the `Admin` role
- `Auth` exposes `POST /api/auth/login` and `GET /api/auth/me` for local testing

### Frontend

- `http://localhost:5173/login`
- `http://localhost:5173/projects`
- `http://localhost:5173/my-tasks`
- `http://localhost:5173/reports`
- `http://localhost:5173/admin`

## Using Local PostgreSQL Instead of In-Memory

This is optional.

The current scaffold is able to run without a database, but if you want HorusVis to use PostgreSQL locally, start a local instance and provide a connection string.

### Example with Docker

```bash
docker volume create horusvis-postgres
docker run --name horusvis-postgres -d -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=horusvis -p 5432:5432 -v horusvis-postgres:/var/lib/postgresql/data --restart unless-stopped postgres:17
```

### Configure the backend connection string

You can configure PostgreSQL in either of these ways:

1. Update `backend/src/HorusVis.Web/appsettings.Development.json`
1. Set an environment variable such as `ConnectionStrings__HorusVis`

Example connection string:

```text
Host=localhost;Port=5432;Database=horusvis;Username=postgres;Password=postgres
```

The current design-time factory in `HorusVis.Data.Migrations` already uses the same local PostgreSQL defaults.
It now reads `ConnectionStrings:HorusVis` from `HorusVis.Web` appsettings and environment variables instead of using a hardcoded connection string.

## Migrations Status

The scaffold includes a migrations project and a design-time factory, but no EF Core migrations are checked in yet.

That means:

- local runtime can still work with the in-memory fallback
- PostgreSQL can be wired in now
- `dotnet ef database update` is only useful after actual migrations are added

For creating, cleaning up, removing, and rolling back migrations, see [AddMigrations.md](AddMigrations.md).

When HorusVis starts carrying migrations, run them from:

```bash
cd backend/src/HorusVis.Data.Migrations
dotnet ef database update --startup-project ../HorusVis.Web
```

## Environment Notes

If you do not use the built-in launch profile, set these explicitly:

- `ASPNETCORE_ENVIRONMENT=Development`
- `DOTNET_ENVIRONMENT=Development`

The frontend reads its API base URL from `VITE_API_BASE_URL`.

## Current Scope and Limitations

At the moment, local HorusVis is still a scaffold:

- backend controllers return placeholder responses
- frontend routes and pages are placeholder shells
- there is no local data-copy workflow from non-prod
- there are no Docker helper scripts yet
- there is no Swagger or NSwag generation flow required to run locally

This document should evolve as real features, migrations, and operational scripts are added.
