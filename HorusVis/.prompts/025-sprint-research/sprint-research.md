<sprint_research>

<confidence>HIGH — all referenced entity files, the DbContext, existing migrations, and the velocity service
were read in full. Minor uncertainty on IP-sprint overflow handling (see open_questions).</confidence>

<assumptions>
- Fiscal year starts April 1 each calendar year (confirmed by user's example: 2026Q1-1 → 2026-04-01).
  Quarter labels follow the calendar year of the quarter's start month:
    Q1 = April–June,  Q2 = July–September,
    Q3 = October–December,  Q4 = January–March (labeled with the year January falls in).
- Sprints are project-scoped, not shared across projects.
- A WorkTask or Issue can be assigned to at most one active sprint at a time (standard Scrum).
- The codebase stores all enums as their string name (per ConfigureConventions convention).
- DB schema is "horusvis" (Postgres, confirmed from InitialCreate migration).
- Entity surrogate PKs are Guid, never auto-generated (DatabaseGeneratedOption.None + required Guid Id).
</assumptions>

<findings>

<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<entity_design>

## 1. Sprint Entity

### Proposed C# class

```csharp
// File: HorusVis.Data/Horusvis/Entities/Sprint.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HorusVis.Data.Enums;
using Microsoft.EntityFrameworkCore;

namespace HorusVis.Data.Horusvis.Entities;

/// <summary>
/// A two-week iteration scoped to a Project.
/// SprintCode format: {YEAR}Q{Q}-{N} for regular sprints, {YEAR}Q{Q}-IP for the IP (Innovation &amp; Planning) sprint.
/// </summary>
[Table("Sprints")]
[Index(nameof(ProjectId), nameof(SprintCode), IsUnique = true)]
public class Sprint
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required Guid Id { get; set; }

    /// <summary>Project this sprint belongs to.</summary>
    public required Guid ProjectId { get; set; }

    [DeleteBehavior(DeleteBehavior.Cascade)]
    [ForeignKey(nameof(ProjectId))]
    public Project Project { get; set; } = null!;

    /// <summary>
    /// Human-readable code, unique within a project.
    /// Examples: "2026Q1-1", "2026Q1-IP".
    /// </summary>
    [Required]
    [MaxLength(20)]
    public required string SprintCode { get; set; }

    /// <summary>1–7. Sprint 7 is always the IP sprint.</summary>
    public required int SprintNumber { get; set; }

    /// <summary>True when SprintNumber == 7.</summary>
    public required bool IsIpSprint { get; set; }

    public required DateOnly StartDate { get; set; }

    public required DateOnly EndDate { get; set; }

    /// <summary>Optional sprint goal statement.</summary>
    [MaxLength(500)]
    public string? Goal { get; set; }

    public required SprintStatus Status { get; set; }

    public required DateTimeOffset CreatedAt { get; set; }
}
```

### Proposed SprintStatus enum

```csharp
// File: HorusVis.Data/Enums/SprintStatus.cs
namespace HorusVis.Data.Enums;

public enum SprintStatus
{
    Planning,   // Sprint created but not yet started
    Active,     // Sprint is currently running (only one Active sprint per project at a time)
    Completed,  // Sprint ended normally
    Cancelled,  // Sprint was abandoned without completing
}
```

### Project-scoped vs. cross-project

**Decision: Project-scoped.** WorkTask and Issue both belong to a Project; a cross-project sprint
would require relaxing the invariant that sprint items belong to the same scope as the sprint.
The naming algorithm already incorporates no project identity — the SprintCode is project-agnostic
in format but uniqueness is enforced per (ProjectId, SprintCode), allowing the same code on
different projects (e.g., two projects can both have "2026Q1-3", pointing to the same calendar
window but tracked independently).

</entity_design>

<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<naming_algorithm>

## 2. Quarter / Sprint Calendar Algorithm

### Fiscal year definition

The user's quarters are **fiscal quarters with the fiscal year starting April 1 each calendar year**:

| Quarter label | Calendar months            | Quarter start | Quarter end (approx) |
|---------------|---------------------------|---------------|----------------------|
| {Y}Q1         | April – June of year Y     | April 1, Y    | June 30, Y           |
| {Y}Q2         | July – September of year Y | July 1, Y     | September 30, Y      |
| {Y}Q3         | October – December of year Y | Oct 1, Y    | December 31, Y       |
| {Y}Q4         | January – March of year Y+1* | Jan 1, Y+1  | March 31, Y+1        |

*Q4 is labeled with the year the quarter starts in (January), so January 2027 = **2027Q4**.

### Sprint date algorithm (pseudocode)

```
// Input: year (int), quarter (int 1-4), sprintNumber (int 1-7)
// Returns: (StartDate: DateOnly, EndDate: DateOnly, SprintCode: string)

int[] quarterStartMonths = { 4, 7, 10, 1 };  // index: quarter-1

DateOnly QuarterStart(int year, int quarter) =>
    new DateOnly(year, quarterStartMonths[quarter - 1], 1);

(DateOnly start, DateOnly end, string code) SprintDateRange(int year, int quarter, int sprintNumber) {
    DateOnly qStart = QuarterStart(year, quarter);
    int offset = (sprintNumber - 1) * 14;          // each sprint = exactly 14 calendar days
    DateOnly sprintStart = qStart.AddDays(offset);
    DateOnly sprintEnd   = sprintStart.AddDays(13); // inclusive end date

    string code = sprintNumber == 7
        ? $"{year}Q{quarter}-IP"
        : $"{year}Q{quarter}-{sprintNumber}";

    return (sprintStart, sprintEnd, code);
}
```

**Verification with user's examples:**
- `SprintDateRange(2026, 1, 1)` → start = 2026-04-01, end = 2026-04-14, code = "2026Q1-1" ✓
- `SprintDateRange(2026, 1, 2)` → start = 2026-04-15, end = 2026-04-28, code = "2026Q1-2" ✓

**Full 2026Q1 schedule:**

| Code        | Start      | End        |
|-------------|------------|------------|
| 2026Q1-1    | 2026-04-01 | 2026-04-14 |
| 2026Q1-2    | 2026-04-15 | 2026-04-28 |
| 2026Q1-3    | 2026-04-29 | 2026-05-12 |
| 2026Q1-4    | 2026-05-13 | 2026-05-26 |
| 2026Q1-5    | 2026-05-27 | 2026-06-09 |
| 2026Q1-6    | 2026-06-10 | 2026-06-23 |
| 2026Q1-IP   | 2026-06-24 | **2026-07-07** ← overflows 7 days into Q2 |

### IP sprint overflow

7 sprints × 14 days = 98 days. A fiscal quarter is 91–92 days (April–June, July–Sept, Oct–Dec)
or 90 days (Jan–Mar non-leap). This means the IP sprint always overflows the calendar quarter
boundary by **6–8 days**. Two acceptable policies — **decision needed** (see open_questions):

- **Policy A (Overflow allowed):** The IP sprint EndDate is always `quarterStart + 97` regardless
  of calendar month boundaries. This is simplest and keeps all sprints uniform at 14 days.
- **Policy B (Clipped):** The IP sprint EndDate is `min(quarterStart + 97, nextQuarterStart - 1)`.
  This results in the IP sprint being shorter (7–8 days) in most quarters.

Recommended: **Policy A** — uniform 14-day sprints are easier to reason about and the slight
calendar overflow is acceptable for a planning-focused tool.

### Bulk-generate all 7 sprints for a quarter

```csharp
// C# utility method
IReadOnlyList<(DateOnly Start, DateOnly End, string Code, int Number, bool IsIp)>
GenerateSprintSchedule(int year, int quarter)
{
    var results = new List<(DateOnly, DateOnly, string, int, bool)>();
    for (int n = 1; n <= 7; n++)
    {
        var (start, end, code) = SprintDateRange(year, quarter, n);
        results.Add((start, end, code, n, n == 7));
    }
    return results;
}
```

</naming_algorithm>

<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<fk_strategy>

## 3. Relationship to WorkTask and Issue

### Options evaluated

| Option | Description | Fits codebase? | Notes |
|--------|-------------|---------------|-------|
| **A** | Nullable `SprintId` FK directly on `WorkTask` and `Issue` | ✅ Best fit | Matches how `TaskId?` on Issue and `FeatureAreaId?` on WorkTask work |
| B | Separate join table `SprintItems` | ⚠️ Overkill | Needed only if multi-sprint membership is required |
| C | Sprint owns items via assignment table | ❌ | Adds unnecessary indirection; assignment is already handled at WorkTask/Issue level |

### Recommendation: Option A

**Why:** The existing codebase uses nullable FKs for optional many-to-one relationships
(`Issue.TaskId?`, `WorkTask.FeatureAreaId?`, `Subtask.TaskId?/IssueId?`). Adding a nullable
SprintId to WorkTask and Issue follows the exact same pattern. Sprint membership is 1:M
(one sprint → many tasks/issues), not M:M (a task is in at most one sprint at a time).

**Changes to WorkTask:**
```csharp
// Add to WorkTask.cs:
public Guid? SprintId { get; set; }

[DeleteBehavior(DeleteBehavior.SetNull)]
[ForeignKey(nameof(SprintId))]
public Sprint? Sprint { get; set; }
```

**Changes to Issue.cs:**
```csharp
// Add to Issue.cs:
public Guid? SprintId { get; set; }

[DeleteBehavior(DeleteBehavior.SetNull)]
[ForeignKey(nameof(SprintId))]
public Sprint? Sprint { get; set; }
```

**Delete behavior:** `SetNull` — deleting a sprint does not cascade-delete the tasks/issues;
they become un-sprinted (SprintId = null). This is the safe and expected behavior.

**Cross-project constraint:** Since SprintId references a Sprint that has its own ProjectId,
a check constraint or service-layer validation must ensure `task.ProjectId == sprint.ProjectId`.
The recommended approach is a service-layer guard (EF Core doesn't enforce cross-column
referential integrity natively). Add a comment to both entity classes documenting this invariant.

### Navigation property on Sprint (optional, lazy)
Navigation collections on Sprint are NOT needed for the entity class itself but are useful
for queries. They can be added when the SprintsService is implemented:
```csharp
// Optional in Sprint.cs if needed for explicit loading:
public ICollection<WorkTask> Tasks { get; set; } = [];
public ICollection<Issue> Issues { get; set; } = [];
```

</fk_strategy>

<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<migration_plan>

## 4. Migration Plan

### Existing migrations (as of 2026-04-09)

| File | Description |
|------|-------------|
| `20260407174335_InitialCreate.cs` | Full schema — all tables, indexes, FKs |
| `20260408035933_SeedAdminUser.cs` | Seeds admin user + role |
| `20260408082335_AddRoleIsSystem.cs` | Adds `IsSystem` column to `Roles` |
| `HorusVisDbContextModelSnapshot.cs` | EF model snapshot (auto-maintained) |

### New migration: `AddSprint`

The migration must execute in this order to satisfy FK constraints:

**Step 1 — Create `Sprints` table:**
```sql
CREATE TABLE horusvis."Sprints" (
    "Id"          uuid NOT NULL,
    "ProjectId"   uuid NOT NULL,
    "SprintCode"  character varying(20) NOT NULL,
    "SprintNumber" integer NOT NULL,
    "IsIpSprint"  boolean NOT NULL,
    "StartDate"   date NOT NULL,
    "EndDate"     date NOT NULL,
    "Goal"        character varying(500),
    "Status"      text NOT NULL,
    "CreatedAt"   timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Sprints" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Sprints_Projects_ProjectId"
        FOREIGN KEY ("ProjectId") REFERENCES horusvis."Projects"("Id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "IX_Sprints_ProjectId_SprintCode"
    ON horusvis."Sprints" ("ProjectId", "SprintCode");
```

**Step 2 — Add nullable `SprintId` to `Tasks` table:**
```sql
ALTER TABLE horusvis."Tasks"
    ADD COLUMN "SprintId" uuid NULL,
    ADD CONSTRAINT "FK_Tasks_Sprints_SprintId"
        FOREIGN KEY ("SprintId") REFERENCES horusvis."Sprints"("Id") ON DELETE SET NULL;
```

**Step 3 — Add nullable `SprintId` to `Issues` table:**
```sql
ALTER TABLE horusvis."Issues"
    ADD COLUMN "SprintId" uuid NULL,
    ADD CONSTRAINT "FK_Issues_Sprints_SprintId"
        FOREIGN KEY ("SprintId") REFERENCES horusvis."Sprints"("Id") ON DELETE SET NULL;
```

### DbContext update

Register the new `SprintStatus` enum in `ConfigureConventions`:
```csharp
configurationBuilder.Properties<SprintStatus>().HaveConversion<string>();
```

No change to `OnModelCreating` is needed because `FindAllModelsConvention` auto-discovers
the `Sprint` entity via assembly scanning.

### Migration generation command

```bash
cd backend/src/HorusVis.Data.Migrations
dotnet ef migrations add AddSprint \
  --project . \
  --startup-project . \
  --context HorusVisDbContext
```

</migration_plan>

<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<api_surface>

## 5. API Surface

### Sprint CRUD

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/projects/{projectId}/sprints` | List all sprints for a project (can filter by status) |
| `GET`  | `/api/projects/{projectId}/sprints/{sprintId}` | Get sprint detail with item counts |
| `POST` | `/api/projects/{projectId}/sprints` | Create a single sprint |
| `POST` | `/api/projects/{projectId}/sprints/generate` | Bulk-generate 7 sprints for a quarter (body: `{ year, quarter }`) |
| `PUT`  | `/api/projects/{projectId}/sprints/{sprintId}` | Update sprint (Goal, Status, dates) |
| `DELETE` | `/api/projects/{projectId}/sprints/{sprintId}` | Delete sprint (sets SprintId = null on items) |

### Sprint item assignment

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/projects/{projectId}/sprints/{sprintId}/tasks` | Assign tasks to sprint (body: `{ taskIds: Guid[] }`) |
| `DELETE` | `/api/projects/{projectId}/sprints/{sprintId}/tasks/{taskId}` | Remove task from sprint |
| `POST` | `/api/projects/{projectId}/sprints/{sprintId}/issues` | Assign issues to sprint |
| `DELETE` | `/api/projects/{projectId}/sprints/{sprintId}/issues/{issueId}` | Remove issue from sprint |

### Sprint board / overview

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/projects/{projectId}/sprints/{sprintId}/board` | Kanban board view for the sprint |
| `GET`  | `/api/projects/{projectId}/sprints/active` | Convenience: returns the single Active sprint |

### Request/Response DTOs (outline)

```csharp
// Create / Generate
record CreateSprintRequest(
    string SprintCode, int SprintNumber, bool IsIpSprint,
    DateOnly StartDate, DateOnly EndDate, string? Goal);

record GenerateSprintsRequest(int Year, int Quarter);

// Response
record SprintDto(
    Guid Id, string SprintCode, int SprintNumber, bool IsIpSprint,
    DateOnly StartDate, DateOnly EndDate, string? Goal,
    string Status, int TaskCount, int IssueCount);
```

</api_surface>

<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<velocity_update>

## 6. Sprint Velocity / Reporting Hooks

### Current implementation (ProjectsService.GetProjectOverviewAsync)

```csharp
// Current: rolling 21-day window arbitrarily divided by 3
var since21 = DateTimeOffset.UtcNow.AddDays(-21);
var doneLast21 = await dbContext.Set<WorkTask>()
    .CountAsync(t => t.ProjectId == projectId
                  && t.Status == WorkTaskStatus.Done
                  && t.UpdatedAt >= since21, ct);
var velocityScore = Math.Round(doneLast21 / 3.0m, 1);  // tasks/week (approx)
```

### Post-Sprint velocity calculation

Once Sprint exists, velocity should be computed **per completed sprint** rather than
the rolling window. The standard Scrum metric is:

```
SprintVelocity = SUM(PlanEstimate) of WorkTasks marked Done within the Sprint
```

**Updated logic sketch (for use when Sprint is available):**

```csharp
// Find the last N completed sprints for this project
var completedSprints = await dbContext.Set<Sprint>()
    .Where(s => s.ProjectId == projectId && s.Status == SprintStatus.Completed)
    .OrderByDescending(s => s.EndDate)
    .Take(3)
    .ToListAsync(ct);

decimal velocity = 0;
if (completedSprints.Any())
{
    // Average story points of Done tasks across last 3 completed sprints
    var sprintIds = completedSprints.Select(s => s.Id).ToList();
    var pointsPerSprint = await dbContext.Set<WorkTask>()
        .Where(t => t.ProjectId == projectId
                 && t.SprintId.HasValue
                 && sprintIds.Contains(t.SprintId.Value)
                 && t.Status == WorkTaskStatus.Done
                 && t.PlanEstimate.HasValue)
        .GroupBy(t => t.SprintId)
        .Select(g => g.Sum(t => t.PlanEstimate!.Value))
        .ToListAsync(ct);

    velocity = pointsPerSprint.Any()
        ? Math.Round(pointsPerSprint.Average(), 1)
        : 0;
}
else
{
    // Fallback to rolling 21-day window until first sprint is completed
    var since21 = DateTimeOffset.UtcNow.AddDays(-21);
    var doneLast21 = await dbContext.Set<WorkTask>()
        .CountAsync(t => t.ProjectId == projectId
                      && t.Status == WorkTaskStatus.Done
                      && t.UpdatedAt >= since21, ct);
    velocity = Math.Round(doneLast21 / 3.0m, 1);
}
```

### ReportSnapshot / TeamPerformanceMetric

- `ReportSnapshot.TaskVelocityPercent` can be updated to store sprint-scoped velocity.
- `Team.VelocityTarget` (already exists) can be compared against the new per-sprint velocity.
- `RecommendationService` threshold (`< 5 points`) remains valid once velocity is in story points.

</velocity_update>

</findings>

<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<open_questions>

1. **IP sprint overflow (Policy A vs B):**
   The IP sprint always overflows the fiscal quarter by 6–8 days with Policy A (uniform 14-day
   sprints). Is that acceptable, or should the IP sprint be truncated to the exact quarter end?

2. **One active sprint per project — enforced where?**
   Should the service layer reject activating a second sprint if one is already Active for the
   same project? Or is it valid to have multiple Active sprints (e.g., across different teams)?

3. **Sprint membership validation:**
   Should the API enforce that sprint items (tasks/issues) belong to the same project as the sprint,
   at the service layer? (EF Core won't enforce this automatically.)

4. **Q4 year labeling:**
   January 2027 = "2027Q4" per the fiscal-year convention derived above. Confirm this is the
   intended label (not "2026Q4").

5. **SprintCode uniqueness scope:**
   Currently proposed as unique per (ProjectId, SprintCode). If sprints are ever cross-project
   in the future, this constraint will need relaxing. Confirm project-scoped is final.

6. **PlanEstimate in velocity:**
   `WorkTask.PlanEstimate` is `numeric(5,1)` and nullable. Tasks without a PlanEstimate
   are excluded from story-point velocity. Should they count as 0 or be excluded entirely?

</open_questions>

<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<dependencies>

- **EF Core migration** requires `HorusVis.Data.Migrations` project to be built and the
  `HorusVisDbContext` to reference the updated model (Sprint entity + SprintId FKs).
- **SprintStatus enum** must be added to `HorusVis.Data/Enums/SprintStatus.cs` and registered
  in `HorusVisDbContext.ConfigureConventions` before the migration is generated.
- **ISprintsService + SprintsService** belong in `HorusVis.Business`.
- **SprintsController** belongs in `HorusVis.Web/Controllers/`.
- The `GetProjectOverviewAsync` velocity logic should NOT be changed until at least one sprint
  is completed (the fallback path keeps backward compatibility).

</dependencies>

</sprint_research>
