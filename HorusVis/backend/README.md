# HorusVis Backend

Scaffolded in the Siren style with a layered .NET solution:

- `src/HorusVis.Core`
- `src/HorusVis.Business`
- `src/HorusVis.Data`
- `src/HorusVis.Data.Migrations`
- `src/HorusVis.Web`
- `tests/*`

This is structure-only scaffolding. Application features are intentionally not implemented yet.

## Current backend foundations

- `HorusVis.Data` includes a scaffold `HorusVisDbContext` and placeholder entities.
- `HorusVis.Business` exposes DI registration and empty service contracts for the main feature areas.
- `HorusVis.Web` exposes placeholder controllers for auth, projects, my-tasks, reports, and admin.
- `HorusVis.Web` now includes Swagger and JWT bearer authentication scaffolding so feature controllers can use `[Authorize]`.
- `appsettings*.json` include sample `ConnectionStrings:HorusVis`, `HorusVis`, and `Authentication:Jwt` settings.
