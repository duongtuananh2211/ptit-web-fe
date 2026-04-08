# Task Management Research Summary

**Use dnd-kit (Kanban), TanStack Query v5 (data), React Hook Form v7 (forms), Recharts v3.8 (charts), RFC 7807 ProblemDetails (errors), keyset pagination (admin) — all verified production-ready April 2026.**

## Version
v1 | April 8, 2026

## Key Findings
- **Kanban**: dnd-kit replaces archived react-beautiful-dnd; `@dnd-kit/sortable` for 4-column board
- **Data Fetching**: TanStack Query v5 (object-form API only); optimistic mutations built-in
- **Forms**: React Hook Form v7.72.1 (<9KB, zero deps); Formik is stalled — avoid
- **Charting**: Recharts v3.8.1 (React-first, SVG, tree-shakeable, ~40–50KB gzipped)
- **Error Handling**: RFC 7807 ProblemDetails is built-in to ASP.NET Core 10 (just `AddProblemDetails()`)
- **Pagination**: Keyset/cursor pagination in EF Core 10 for admin user directory
- **State**: Context (global/auth) + Zustand (domain/tasks/filters)
- **Toast**: `sonner` (~10KB)
- **EF Core GroupBy**: Use explicit scalar-FK joins — avoid `GroupBy` on navigation properties (client-side eval risk)

## Task Workstream Status

| Task | Status | Key Notes |
|------|--------|-----------|
| 00 DB Migration | ✅ Done | All tables present; UserSessions, FeatureAreas, ReportSnapshots confirmed |
| 01 Login | ✅ Done | JWT bearer + httpOnly refresh cookie; DAO + UoW pattern |
| 02 Projects | 🔲 Pending | Recharts for KPI cards; React Hook Form for member drawer; Timeline optional |
| 03 My Tasks | 🔲 Pending | dnd-kit Kanban; SubtaskTable inline effort edit; progress formula server-computed |
| 04 Reports | 🔲 Pending | On-demand aggregation (no snapshots needed for MVP); use explicit join in GroupBy |
| 05 Admin | 🔲 Pending | Keyset pagination; `IHealthChecks` for system health; deployment panel is optional |

## Decisions Needed
1. **Comments/Activity Log** (Task 03): Include in MVP or defer?
2. **Export formats** (Task 04): CSV only or PDF/Excel for demo?
3. **Deployment history** (Task 05): Manual seed or CI/CD webhook source?

## Blockers
None — all recommended libraries are production-ready and compatible with React 18 + TypeScript 5 + Vite 5 + ASP.NET Core 10.

## Next Step
Create a plan prompt for Tasks 02–05 (or one plan per task) referencing this research.

---
*Confidence: High*
*Full output: task-mgmt-research.md*
