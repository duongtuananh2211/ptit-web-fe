<objective>
Research how to add Sprint support to HorusVis: data model design, sprint naming/calendar algorithm,
relationships to existing WorkTask and Issue entities, migration strategy, and API surface.

Purpose: Produces a research document that informs a subsequent Plan prompt and EF Core migration.
Scope: Entity design, naming conventions, FK strategy, quarter/sprint calendar math, API shape.
Output: .prompts/025-sprint-research/sprint-research.md with structured findings + SUMMARY.md
</objective>

<context>
Current entity inventory — read these files in full before starting:

Project entity:
@backend/src/HorusVis.Data/Horusvis/Entities/Project.cs

WorkTask entity:
@backend/src/HorusVis.Data/Horusvis/Entities/WorkTask.cs

Issue entity:
@backend/src/HorusVis.Data/Horusvis/Entities/Issue.cs

Subtask entity (for completeness — understand parent chain):
@backend/src/HorusVis.Data/Horusvis/Entities/Subtask.cs

Existing enum folder (to understand what enums already exist):
@backend/src/HorusVis.Data/Enums/

One existing migration for DB column reference:
@backend/src/HorusVis.Data.Migrations/Migrations/

EF Core DbContext pattern (auto-discovers entities — no explicit DbSet):
@backend/src/HorusVis.Data/Horusvis/HorusVisDbContext.cs
</context>

<research_scope>
<include>

1. **Sprint entity design**
   - What fields does a Sprint need?
     - Id (Guid), SprintCode (string, e.g. "2026Q2-3"), ProjectId (FK to Project),
       StartDate (DateOnly), EndDate (DateOnly), Goal (string?), Status (enum)
   - Should Sprint belong to a Project, or be cross-project (shared calendar)?
   - What SprintStatus values make sense? (Planning, Active, Completed, etc.)

2. **Quarter/sprint naming algorithm**
   - User's spec:
     - Each quarter is divided into **7 sprints** (2 weeks each = 14 weeks ≈ quarter)
     - Sprints 1–6 are named: {YEAR}Q{Q}-{N}  e.g. 2026Q2-1, 2026Q2-2 … 2026Q2-6
     - Sprint 7 (last) is the IP sprint: {YEAR}Q{Q}-IP  e.g. 2026Q2-IP
     - Example dates given:
       - 2026Q1-1: 2026-04-01 → 2026-04-14  (NOTE: this appears to be Q2 by calendar month;
         research whether the user's quarters are fiscal/custom or calendar)
       - 2026Q1-2: 2026-04-15 → 2026-04-28
   - Derive the algorithm for: given a quarter label + sprint index → compute StartDate/EndDate
   - Edge case: does the 7th sprint (IP) always end exactly at quarter boundary?
   - Can sprints be generated automatically from a quarter start date?

3. **Relationship to WorkTask and Issue**
   - Option A: Add nullable `SprintId` FK to both `WorkTask` and `Issue` tables
     - Pros: simple join; direct assignment
     - Cons: requires two migrations (one per table)
   - Option B: A separate join table `SprintItems` (SprintId, TaskId?, IssueId?)
     - Pros: flexible, avoids altering existing tables
     - Cons: more complex queries; nullable columns in join table
   - Option C: Sprint owns Tasks via a separate assignment table (like TaskAssignees pattern)
   - Evaluate which fits best given EF Core `FindAllModelsConvention` auto-discovery pattern

4. **Migration impact**
   - Adding a new `Sprint` table (new entity — no impact on existing tables)
   - Adding `SprintId` FK to `WorkTask` — must be nullable (existing rows have no sprint)
   - Adding `SprintId` FK to `Issue` — must be nullable
   - Or if join table chosen: new table only, no alteration of existing tables
   - Identify which migration files currently exist to understand state

5. **API design implications**
   - Endpoints needed:
     - `GET /api/projects/{id}/sprints` — list sprints for a project
     - `POST /api/projects/{id}/sprints` — create sprint (manual or auto-generate quarter)
     - `POST /api/projects/{id}/sprints/generate-quarter` — auto-generate 7 sprints from a quarter
     - `GET /api/projects/{id}/sprints/{sprintId}` — sprint detail with tasks + issues
     - `PUT /api/projects/{id}/sprints/{sprintId}` — update sprint (rename goal, dates)
     - `DELETE /api/projects/{id}/sprints/{sprintId}` — delete (only if Planning status?)
     - `POST /api/projects/{id}/sprints/{sprintId}/items` — assign task/issue to sprint
     - `DELETE /api/projects/{id}/sprints/{sprintId}/items/{itemId}` — remove from sprint
   - Who can assign tasks to sprint? Only project members? Only owner?
   - Can a task/issue belong to multiple sprints simultaneously?

6. **Sprint velocity / reporting hooks**
   - The existing `GetProjectOverviewAsync` already computes VelocityScore from last 21 days.
   - With Sprint data: velocity should be tasks completed within the sprint duration.
   - Research how to update VelocityScore calculation once Sprint entity exists.

</include>

<exclude>
- Frontend implementation (deferred to FE prompts)
- Sprint-based burndown chart implementation (deferred to reports)
- Team sprint assignment / capacity planning (out of scope for this feature)
</exclude>
</research_scope>

<verification_checklist>
□ Read all referenced entity files fully before drawing conclusions
□ Check existing migration files to understand current DB state
□ Confirm EF Core cascade behavior rules for nullable FK on WorkTask/Issue
□ Verify the quarter/sprint naming examples are internally consistent
□ Confirm whether IP sprint is week 13-14 and falls within the quarter boundary
□ Evaluate all three FK strategy options against existing codebase patterns
□ Check if any Sprint-like concept already exists in schema (TeamPerformanceMetric?)
</verification_checklist>

<research_quality_assurance>
Before completing:
- [ ] All 6 research areas covered with documented findings
- [ ] Recommendation given for FK strategy with justification
- [ ] SprintCode generation algorithm written out in pseudocode
- [ ] Migration impact explicitly listed (tables added, columns added)
- [ ] Open questions flagged (things that need user decision before planning)
</research_quality_assurance>

<output_format>
Write findings to: `.prompts/025-sprint-research/sprint-research.md`

Structure:
```xml
<sprint_research>

<confidence>High/Medium/Low with explanation</confidence>

<assumptions>
List assumptions made about: fiscal vs calendar quarters, IP sprint purpose, ownership rules
</assumptions>

<findings>

  <entity_design>
    Recommended Sprint entity fields with types, constraints, and rationale.
    Recommended SprintStatus enum values.
    Whether Sprint is project-scoped or global.
  </entity_design>

  <naming_algorithm>
    Quarter-to-sprint mapping algorithm in pseudocode.
    StartDate/EndDate derivation for each sprint index (1–7).
    IP sprint treatment.
    Class or static helper proposed.
  </naming_algorithm>

  <fk_strategy>
    Evaluation of Option A / B / C.
    Recommended option with pros/cons.
    Impact on WorkTask and Issue entities.
    EF Core cascade delete behavior recommendation.
  </fk_strategy>

  <migration_plan>
    List of tables/columns to add.
    Migration order (new table first, FKs second if Option A).
    Risk level.
  </migration_plan>

  <api_surface>
    Finalized list of endpoints with HTTP verb, route, purpose.
    Auth notes (owner-only vs member).
    Multi-sprint membership rule (can task be in multiple sprints?).
  </api_surface>

  <velocity_update>
    How GetProjectOverviewAsync should change once Sprint exists.
    Backward-compatible approach.
  </velocity_update>

</findings>

<open_questions>
List decisions that require user input before planning can begin.
</open_questions>

<dependencies>
What must exist before implementation can begin.
</dependencies>

</sprint_research>
```

Then create `.prompts/025-sprint-research/SUMMARY.md` with:
- One-liner: Substantive description of recommendation
- Key Findings: Actionable bullet points
- Decisions Needed: User input required before planning
- Blockers: External impediments
- Next Step: Concrete action
</output_format>

<success_criteria>
1. sprint-research.md created with all 6 finding sections populated
2. FK strategy recommendation is clear with justification
3. SprintCode generation algorithm is unambiguous (deterministic from inputs)
4. Migration impact list is exhaustive
5. Open questions are concrete and answerable
6. SUMMARY.md created with substantive one-liner
</success_criteria>
