# Reports Plan — SUMMARY

## One-liner

Implement the HorusVis Reports page end-to-end: 4 KPI cards + Bug Density BarChart + Team
Performance BarChart + Critical Issues list + rule-based Recommendation panel + CSV export,
using on-demand EF Core aggregation (no snapshot writes), Recharts v3.8, and TanStack Query
polling at 5-minute staleTime.

---

## Phase Table

| # | Name | Scope | Key files |
|---|------|-------|-----------|
| 1 | Backend — DTOs + Service Interface | Define all response DTO records + `IReportsService` methods | `Business/Models/Reports/*.cs`, `Business/Contracts/IReportsService.cs` |
| 2 | Backend — Service Implementations | `ReportsService` (5 queries), `RecommendationService` (5 rules), `ReportExportService` (CSV) | `Business/Services/*.cs`, `ServiceCollectionExtensions.cs` |
| 3 | Backend — Controller + API | Replace placeholder; wire 5 GET + 1 POST endpoints with param validation | `Web/Controllers/ReportsController.cs` |
| 4 | Frontend — API Layer + Hooks | `reportsApi.ts`, TypeScript types, `useReports.ts` TanStack Query hooks | `src/api/*.ts`, `src/hooks/useReports.ts` |
| 5 | Frontend — UI Components + ReportsPage | 10 components under `src/components/reports/`, replace `ReportsPage.tsx` | `src/pages/ReportsPage.tsx`, `src/components/reports/*.tsx` |

---

## API Contracts (all endpoints)

| Method | Route | Query params | Returns |
|--------|-------|-------------|---------|
| GET | `/api/reports/dashboard` | `projectId?` | `ReportDashboardDto` |
| GET | `/api/reports/bug-density` | `projectId?`, `days=30` | `BugDensityItemDto[]` |
| GET | `/api/reports/team-performance` | `projectId?`, `days=30` | `TeamPerformanceItemDto[]` |
| GET | `/api/reports/critical-issues` | `projectId?`, `topN=10` | `CriticalIssueDto[]` |
| GET | `/api/reports/recommendations` | `projectId?` | `RecommendationItemDto[]` |
| POST | `/api/reports/export` | `projectId?`, `format=csv` | `text/csv` file download |

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Aggregation strategy | On-demand (no snapshot writes) | 5–50 users → sub-1s query latency acceptable |
| Charts | Recharts v3.8 BarChart (bug density, team perf) | React-first, tree-shakeable, full TS |
| Data refresh | TanStack Query `staleTime: 5 * 60_000` | No WebSocket needed at current scale |
| Export | CSV via `StringBuilder` + `File(bytes, "text/csv")` | No extra library for MVP |
| Recommendations | Rule-based text — 5 rules (HIGH_BUG_DENSITY, SLOW_RESOLUTION, etc.) | No ML for MVP |
| EF Core GroupBy | Explicit scalar-FK `Join()` before `GroupBy()` | Avoid nav-property grouping → client-eval warning |
| Bug density join | `Issues → Tasks (TaskId) → FeatureAreas (FeatureAreaId)` | **Issues have no direct FeatureAreaId column** |

---

## Decisions Needed

1. **CapacityRoadmapCard** — The task spec lists it; no data model backing exists. Confirm
   whether to skip entirely for MVP or derive from `ProjectMembers` count.
2. **Trend computation** — KPI trend ↑↓ percentages: implement prior-period comparison in
   Phase 2, or leave nullable for MVP?
3. **Auth header on CSV export** — `exportCsv()` uses raw `fetch()`; confirm how Bearer token
   is attached (from Zustand store? from cookie?).

---

## Blockers

- **`Issues.FeatureAreaId` does not exist** — The research query assumed a direct FK; the actual
  join path is `Issues.TaskId → Tasks.FeatureAreaId`. Issues with null `TaskId` are excluded
  from bug density. This must be handled in Phase 2 with correct join chain.
- **Recharts not yet installed** — Run `npm install recharts@^3.8` before Phase 5; verify
  `package.json` first.
- **CriticalIssues left-join** — Issues with null `CurrentAssigneeUserId` need a left-join;
  EF Core translation may require `.GroupJoin().SelectMany(DefaultIfEmpty)` fallback.

---

## Next Step

**Execute Phase 1**: Create `HorusVis.Business/Models/Reports/` with 5 DTO files and update
`IReportsService.cs` with all 6 method signatures. This unblocks Phases 2 and 3 in parallel.

---

*Confidence: High*
*Full plan: [reports-plan.md](reports-plan.md)*
