# Task Management Data Dump

## Overview

Comprehensive seed data for task management system including Tasks, Issues, Subtasks, and FeatureAreas.

## Files Created

### 1. Migration File
**Location**: `HorusVis.Data.Migrations/Migrations/20260409100000_SeedTaskManagementData.cs`
- EF Core migration with full task management data
- Includes Up() and Down() methods for rollback
- Automatically links Issues to Tasks
- Creates realistic work scenarios across multiple projects

### 2. SQL Dump File
**Location**: `docs/sql/SeedTaskManagementData.sql`
- Standalone SQL for direct PostgreSQL execution
- Includes verification and analytics queries
- Can be executed in pgAdmin or psql

### 3. Documentation
**Location**: `docs/TaskManagementData_README.md` (this file)

## Data Structure

```
Projects (already seeded)
├── WEBAPP (d4d4d4d4...)
│   ├── FeatureArea: AUTH (Authentication & Security)
│   ├── FeatureArea: DASH (Dashboard & Analytics)
│   ├── FeatureArea: REPORT (Reporting & Export)
│   └── Tasks: OAuth2, TwoFactor, Dashboard
├── MOBILE (e5e5e5e5...)
│   ├── FeatureArea: SYNC (Data Synchronization)
│   ├── FeatureArea: IMAGE (Image Processing)
│   └── Task: Offline Mode & Sync
└── DATAENG (f6f6f6f6...)
    └── Task: Pipeline Optimization (no FeatureArea)
```

## Sample Data Details

### Feature Areas (5 total)

| Code | Name | Project | Color | Purpose |
|------|------|---------|-------|---------|
| **AUTH** | Authentication & Security | WEBAPP | #FF6B6B (Red) | OAuth, 2FA, SSO features |
| **DASH** | Dashboard & Analytics | WEBAPP | #4ECDC4 (Teal) | Analytics, charts, reporting |
| **REPORT** | Reporting & Export | WEBAPP | #45B7D1 (Blue) | Report generation, data export |
| **SYNC** | Data Synchronization | MOBILE | #95E1D3 (Mint) | Offline mode, cache sync |
| **IMAGE** | Image Processing | MOBILE | #F38181 (Pink) | Image upload, compression |

### Tasks (5 total)

#### 1. OAuth 2.0 Authentication
- **Project**: WEBAPP
- **FeatureArea**: AUTH
- **Status**: Working (75% progress)
- **Priority**: High
- **Plan Estimate**: 40 story points
- **Duration**: Mar 15 - Apr 20, 2026
- **Subtasks**: 2
  - ST-001: OAuth provider integration (Completed - 18.5 actual vs 16 estimate)
  - ST-002: Unit tests & edge cases (InProgress - 10.5 actual of 12 estimate)
- **Related Issues**: 2 (ISS-001, ISS-002 - both blocking)

#### 2. Two-Factor Authentication
- **Project**: WEBAPP
- **FeatureArea**: AUTH
- **Status**: ToDo (0% progress)
- **Priority**: Critical ⚠️
- **Plan Estimate**: 25 story points
- **Duration**: Apr 9 - May 15, 2026
- **Subtasks**: 2
  - ST-003: Backend TOTP (Defined - not started)
  - ST-004: Frontend 2FA UI (Todo - not started)

#### 3. Dashboard Redesign
- **Project**: WEBAPP
- **FeatureArea**: DASH
- **Status**: Done ✓ (100% progress)
- **Priority**: Medium
- **Plan Estimate**: 32 story points
- **Duration**: Jan 20 - Mar 31, 2026
- **Subtasks**: 1
  - ST-006: Chart optimization (Completed - 12 actual vs 10 estimate)
- **Related Issues**: 1 (ISS-003 - Resolved)

#### 4. Offline Mode & Data Sync
- **Project**: MOBILE
- **FeatureArea**: SYNC
- **Status**: Working (50% progress)
- **Priority**: High
- **Plan Estimate**: 48 story points
- **Duration**: Feb 1 - May 1, 2026
- **Notes**: No subtasks yet (in progress phase)

#### 5. Data Pipeline Optimization
- **Project**: DATAENG
- **FeatureArea**: None (no feature breakdown yet)
- **Status**: Stuck 🔴 (40% progress)
- **Priority**: High
- **Plan Estimate**: 60 story points
- **Duration**: Mar 1 - Apr 30, 2026
- **Notes**: On hold - waiting for infrastructure team

### Issues (3 total)

#### ISS-001: OAuth callback not working (CRITICAL)
- **Project**: WEBAPP
- **Linked Task**: OAuth 2.0 Authentication (t1t1t1t1...)
- **Severity**: Critical
- **Priority**: High
- **Status**: Open
- **WorkflowStage**: Triage
- **Reporter**: SuperAdmin
- **Assignee**: Unassigned
- **Due Date**: Apr 12, 2026
- **Opened**: Apr 7, 2026 16:30 UTC
- **Fix Subtask**:
  - ST-005: Fix OAuth callback for Android (InProgress - 2.5 actual of 8 estimate)

#### ISS-002: Token expiry handling incomplete
- **Project**: WEBAPP
- **Linked Task**: OAuth 2.0 Authentication (t1t1t1t1...)
- **Severity**: Major
- **Priority**: High
- **Status**: Open
- **WorkflowStage**: Debug
- **Reporter**: SuperAdmin
- **Due Date**: Apr 15, 2026
- **Opened**: Apr 8, 2026 10:15 UTC
- **Impact**: Session inconsistency when OAuth token expires

#### ISS-003: Dashboard renders slowly on large datasets (RESOLVED)
- **Project**: WEBAPP
- **Linked Task**: Dashboard Redesign (t3t3t3t3...)
- **Severity**: Major
- **Priority**: Medium
- **Status**: Resolved ✓
- **WorkflowStage**: Fixing
- **Reporter**: SuperAdmin
- **Opened**: Mar 15, 2026
- **Resolution Details**:
  - Fixed by: ST-006 (Virtual scrolling + lazy loading)
  - Optimization completed: Mar 28, 2026
  - Performance improved from 8s → 2s for 500+ data points

### Subtasks (6 total)

| Code | Type | State | Hours Est/Todo/Actual | Assigned | Due Date |
|------|------|-------|---------------------|----------|----------|
| **ST-001** | Task | Completed | 16.0 / 0.0 / 18.5 | SuperAdmin | Mar 25 |
| **ST-002** | Task | InProgress | 12.0 / 4.0 / 10.5 | SuperAdmin | Apr 15 |
| **ST-003** | Task | Defined | 12.0 / 12.0 / 0.0 | Unassigned | Apr 25 |
| **ST-004** | Task | Todo | 10.0 / 10.0 / 0.0 | Unassigned | Apr 28 |
| **ST-005** | Issue | InProgress | 8.0 / 3.0 / 2.5 | SuperAdmin | Apr 14 |
| **ST-006** | Issue | Completed | 10.0 / 0.0 / 12.0 | SuperAdmin | Mar 25 |

#### Subtask State Meanings
- **Todo**: Not yet started
- **Defined**: Requirements documented, waiting to start
- **InProgress**: Currently being worked on
- **Completed**: Finished and verified

## Key Business Logic Demonstrated

### 1. Task Progress Calculation
- **OAuth 2.0 (75%)**: Calculated from subtasks: MIN(100, (18.5+10.5)/(16+12)*100) = 75%
- **Two-Factor (0%)**: No subtasks have actual hours yet
- **Dashboard (100%)**: Completed task = 100%
- **Offline Mode (50%)**: Mid-progress task
- **Pipeline (40%)**: Stuck state with partial progress

### 2. Issue Workflow Progression
```
Issues can move through these stages:
Triage → Debug → Fixing → Verify → (Closed)

Example progression:
ISS-001: Triage (needs engineer to review)
ISS-002: Debug (engineer investigating)
ISS-003: Resolved (moving to verification)
```

### 3. Task Status Intelligence
- **Working**: Task has assigned subtasks in progress
- **Stuck**: Task has critical issues (ISS-001) blocking progress
- **Done**: All subtasks completed, no blocking issues
- **ToDo**: Planned but not started

### 4. Effort Tracking Patterns
```
ST-001 (OAuth Integration):
- Estimated: 16 hours
- Actual: 18.5 hours (+2.5h overrun)

ST-002 (OAuth Tests):
- Estimated: 12 hours
- To-Do: 4 hours remaining
- Actual: 10.5 hours so far
- Status: ~87% complete

Dashboard optimization (ST-006):
- Estimated: 10 hours
- Actual: 12 hours (+2h overrun)
- But fixed the performance issue completely
```

## How to Apply

### Option 1: Using EF Core Migration
```powershell
cd HorusVis/backend/src/HorusVis.Data.Migrations
dotnet ef database update -c HorusVisDbContext
```

This will:
1. Apply SeedProjects migration (if not already applied)
2. Apply SeedTaskManagementData migration
3. Create all FeatureAreas, Tasks, Issues, and Subtasks
4. Automatically link Issues to Tasks

### Option 2: Direct SQL Execution
```bash
# Using psql
psql -h 10.10.30.26 -d horusvis -U postgres -f docs/sql/SeedTaskManagementData.sql

# Using pgAdmin
# 1. Open Query Tool
# 2. Copy/paste contents of SeedTaskManagementData.sql
# 3. Execute (F5)
```

## Relationships Overview

### Task → Issues (One-to-Many)
```
OAuth 2.0 Task (t1t1...)
├── ISS-001 (OAuth callback bug) - CRITICAL
└── ISS-002 (Token expiry bug) - MAJOR

Dashboard Task (t3t3...)
└── ISS-003 (Performance) - MAJOR (RESOLVED)
```

### Task/Issue → Subtasks (One-to-Many)
```
OAuth 2.0 Task
├── ST-001 (OAuth integration) - TASK SUBTASK
└── ST-002 (OAuth tests) - TASK SUBTASK

ISS-001 Issue
└── ST-005 (Fix callback) - ISSUE SUBTASK

ISS-003 Issue
└── ST-006 (Optimize) - ISSUE SUBTASK (COMPLETED)
```

### Task → FeatureArea (Many-to-One, Optional)
```
FeatureArea: AUTH
├── OAuth 2.0 Task (t1t1...)
└── Two-Factor Task (t2t2...)

FeatureArea: DASH
└── Dashboard Redesign Task (t3t3...)

No Feature Area
└── Pipeline Optimization Task (t5t5...)
```

## Data IDs Reference

### Projects (from SeedProjects)
```
WEBAPP:    d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4
MOBILE:    e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5
DATAENG:   f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6
```

### Feature Areas
```
AUTH:      11111111-1111-1111-1111-111111111111
DASH:      22222222-2222-2222-2222-222222222222
REPORT:    33333333-3333-3333-3333-333333333333
SYNC:      44444444-4444-4444-4444-444444444444
IMAGE:     55555555-5555-5555-5555-555555555555
```

### Tasks
```
OAuth2:            aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
TwoFactor:         bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
Dashboard:         cccccccc-cccc-cccc-cccc-cccccccccccc
Offline:           dddddddd-dddd-dddd-dddd-dddddddddddd
Pipeline:          eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee
```

### Issues
```
OAuth Callback:    f1111111-1111-1111-1111-111111111111 (ISS-001)
Token Expiry:      f2222222-2222-2222-2222-222222222222 (ISS-002)
Dashboard Perf:    f3333333-3333-3333-3333-333333333333 (ISS-003)
```

### Subtasks
```
ST-001:            a0000001-0000-0000-0000-000000000001
ST-002:            a0000002-0000-0000-0000-000000000002
ST-003:            a0000003-0000-0000-0000-000000000003
ST-004:            a0000004-0000-0000-0000-000000000004
ST-005:            a0000005-0000-0000-0000-000000000005
ST-006:            a0000006-0000-0000-0000-000000000006
```

## Testing Endpoints with Sample Data

### Query: Get My Board (Tasks by Status)
```bash
GET /api/tasks/my-board

Response will show tasks grouped by:
- ToDo: 1 task (TwoFactor)
- Working: 2 tasks (OAuth2, Offline)
- Stuck: 1 task (Pipeline)
- Done: 1 task (Dashboard)
```

### Query: Get Task with Issues
```bash
GET /api/tasks/t1t1t1t1-t1t1-t1t1-t1t1-t1t1t1t1t1t1

Response: OAuth 2.0 task with:
- 2 subtasks (ST-001 completed, ST-002 in progress)
- 2 issues (ISS-001 critical, ISS-002 major)
- FeatureArea: AUTH
```

### Query: Get Issue with Subtasks
```bash
GET /api/issues/i1i1i1i1-i1i1-i1i1-i1i1-i1i1i1i1i1i1

Response: ISS-001 (OAuth callback bug) with:
- 1 subtask (ST-005 in progress)
- Linked to OAuth2 task
```

## Notes

- All data uses **SuperAdmin** (c3c3c3c3...) as creator
- Dates are realistic for current development cycle
- Progress percentages reflect actual effort tracking
- Issues demonstrate blocking scenarios
- Subtasks show various completion states
- Color codes for FeatureAreas help visual organization
- "Stuck" task demonstrates workflow status for blocked items

## To Rollback

```powershell
dotnet ef migrations remove -c HorusVisDbContext
```

This will remove the migration and delete all seeded data if database update is re-run.

## File Locations

```
Backend Structure:
HorusVis/
├── backend/
│   ├── src/
│   │   └── HorusVis.Data.Migrations/
│   │       └── Migrations/
│   │           ├── 20260409000000_SeedProjects.cs
│   │           └── 20260409100000_SeedTaskManagementData.cs
│   └── docs/
│       ├── sql/
│       │   ├── SeedProjects.sql
│       │   └── SeedTaskManagementData.sql
│       └── SeedProjects_README.md
│           TaskManagementData_README.md (this file)
```
