# HorusVis

HorusVis is a SaaS task and issue management platform for planning, tracking, and visual analytics, organized as a client-server monorepo.

- `backend/`
- `frontend/`
- `docs/`

Excluded by request:

- `infrastructure/`
- `scripts/`
- `automation/`

## Structure

- `backend/` contains the .NET solution and test projects.
- `frontend/horusvis-react/` contains the React + TypeScript + Vite application using `npm`.
- `frontend/shared/` contains shared client definitions placeholders.
- `docs/` contains the same top-level documentation buckets used in Siren.

## Getting Started

For a full local setup flow, see `docs/development/RunningLocally.md`.

### Backend

```bash
cd backend
dotnet restore HorusVis.sln
dotnet build HorusVis.sln
```

### Frontend

```bash
cd frontend/horusvis-react
npm install
npm run dev
```
