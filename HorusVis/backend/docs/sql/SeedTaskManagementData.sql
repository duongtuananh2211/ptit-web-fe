-- Data Dump for Task Management Tables
-- Generated: 2026-04-09
-- Database: horusvis
-- Tables: FeatureAreas, Tasks, Issues, Subtasks

-- ==============================================================================
-- FEATURE AREAS
-- ==============================================================================

INSERT INTO horusvis."FeatureAreas" ("Id", "ProjectId", "AreaCode", "AreaName", "ColorHex") VALUES

-- WEBAPP Project Feature Areas
('11111111-1111-1111-1111-111111111111', 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'AUTH', 'Authentication & Security', '#FF6B6B'),
('22222222-2222-2222-2222-222222222222', 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'DASH', 'Dashboard & Analytics', '#4ECDC4'),
('33333333-3333-3333-3333-333333333333', 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'REPORT', 'Reporting & Export', '#45B7D1'),

-- MOBILE Project Feature Areas
('44444444-4444-4444-4444-444444444444', 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', 'SYNC', 'Data Synchronization', '#95E1D3'),
('55555555-5555-5555-5555-555555555555', 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', 'IMAGE', 'Image Processing', '#F38181')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- TASKS
-- ==============================================================================

INSERT INTO horusvis."Tasks" (
    "Id", "ProjectId", "FeatureAreaId", "Title", "Description",
    "Priority", "Status", "PlanEstimate", "ProgressPercent",
    "CreatedByUserId", "StartDate", "DueDate", "CreatedAt", "UpdatedAt"
) VALUES

-- WEBAPP: OAuth 2.0 Authentication (Working - 75% progress)
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
    '11111111-1111-1111-1111-111111111111',
    'Implement OAuth 2.0 Authentication',
    'Add OAuth 2.0 support with Google and GitHub providers. Implement callback handling, token storage, and session management.',
    'High', 'Working', 40.0, 75.0,
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    '2026-03-15', '2026-04-20', '2026-03-15T09:00:00+00:00', '2026-04-08T14:30:00+00:00'
),

-- WEBAPP: Two-Factor Authentication (ToDo)
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
    '11111111-1111-1111-1111-111111111111',
    'Two-Factor Authentication Support',
    'Support TOTP (Time-based One-Time Password) and SMS-based 2FA. Integrate Authy API.',
    'Critical', 'ToDo', 25.0, 0.0,
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    '2026-04-09', '2026-05-15', '2026-04-09T10:00:00+00:00', NULL
),

-- WEBAPP: Dashboard Redesign (Done - 100% progress)
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
    '22222222-2222-2222-2222-222222222222',
    'Dashboard Redesign - UI Overhaul',
    'Redesign dashboard layout for better UX. Implement responsive grid, improved charts, and real-time data widgets.',
    'Medium', 'Done', 32.0, 100.0,
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    '2026-01-20', '2026-03-31', '2026-01-20T08:30:00+00:00', '2026-03-31T16:45:00+00:00'
),

-- MOBILE: Offline Mode & Data Sync (Working - 50% progress)
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5',
    '44444444-4444-4444-4444-444444444444',
    'Offline Mode & Data Synchronization',
    'Implement local database caching, background sync, and conflict resolution for offline-first mobile app.',
    'High', 'Working', 48.0, 50.0,
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    '2026-02-01', '2026-05-01', '2026-02-01T11:15:00+00:00', '2026-04-05T13:20:00+00:00'
),

-- DATAENG: Pipeline Optimization (Stuck - 40% progress, needs blocking issue resolution)
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6',
    NULL,
    'Data Processing Pipeline Optimization',
    'Optimize ETL pipeline for 10x throughput improvement. Implement parallel processing and caching.',
    'High', 'Stuck', 60.0, 40.0,
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    '2026-03-01', '2026-04-30', '2026-03-01T09:45:00+00:00', '2026-04-08T15:00:00+00:00'
)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- ISSUES (Bugs/Defects linked to Tasks)
-- ==============================================================================

INSERT INTO horusvis."Issues" (
    "Id", "ProjectId", "TaskId", "IssueCode", "Title", "Summary",
    "Severity", "Priority", "Status", "WorkflowStage",
    "ReporterUserId", "CurrentAssigneeUserId", "DueDate", "OpenedAt"
) VALUES

-- Issue 1: OAuth callback not working (Critical - Blocking OAuth task)
(
    'f1111111-1111-1111-1111-111111111111',
    'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'ISS-001',
    'OAuth callback not working with Android',
    'OAuth callback handler returns 404 on Android devices. Works fine on web. Issue appears to be related to deep link configuration in manifest.',
    'Critical', 'High', 'Open', 'Triage',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', NULL, '2026-04-12', '2026-04-07T16:30:00+00:00'
),

-- Issue 2: Token expiry handling incomplete (Major)
(
    'f2222222-2222-2222-2222-222222222222',
    'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'ISS-002',
    'Token expiry handling incomplete',
    'When OAuth token expires mid-session, user is not properly redirected to re-authenticate. Session becomes inconsistent state.',
    'Major', 'High', 'Open', 'Debug',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', NULL, '2026-04-15', '2026-04-08T10:15:00+00:00'
),

-- Issue 3: Dashboard performance (Major - Resolved)
(
    'f3333333-3333-3333-3333-333333333333',
    'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'ISS-003',
    'Dashboard renders slowly on large datasets',
    'Dashboard with 500+ data points takes 8+ seconds to render. Charts are not responsive once rendered. Need optimization.',
    'Major', 'Medium', 'Resolved', 'Fixing',
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', NULL, '2026-03-28', '2026-03-15T13:45:00+00:00'
)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- SUBTASKS for TASKS (Effort tracking)
-- ==============================================================================

INSERT INTO horusvis."Subtasks" (
    "Id", "TaskId", "IssueId", "SubtaskCode", "Title", "Description", "State",
    "OwnerUserId", "EstimateHours", "ToDoHours", "ActualHours", "DueDate", "CreatedAt", "UpdatedAt"
) VALUES

-- Task: OAuth 2.0 - Subtask 1 (Completed)
(
    'a0000001-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL,
    'ST-001',
    'OAuth provider integration (Google)',
    'Set up Google OAuth app, implement authorization flow, and token handling',
    'Completed', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    16.0, 0.0, 18.5, '2026-03-25', '2026-03-15T09:00:00+00:00', '2026-03-25T17:00:00+00:00'
),

-- Task: OAuth 2.0 - Subtask 2 (InProgress)
(
    'a0000002-0000-0000-0000-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL,
    'ST-002',
    'OAuth unit tests & edge cases',
    'Write comprehensive tests for OAuth flow including error scenarios and token refresh',
    'InProgress', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    12.0, 4.0, 10.5, '2026-04-15', '2026-04-01T10:30:00+00:00', '2026-04-08T14:00:00+00:00'
),

-- Task: Two-Factor Authentication - Subtask 1 (Defined)
(
    'a0000003-0000-0000-0000-000000000003',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL,
    'ST-003',
    'Backend: TOTP generation & verification',
    'Implement TOTP secret generation, QR code generation, and verification logic',
    'Defined', NULL,
    12.0, 12.0, 0.0, '2026-04-25', '2026-04-09T10:00:00+00:00', NULL
),

-- Task: Two-Factor Authentication - Subtask 2 (Todo)
(
    'a0000004-0000-0000-0000-000000000004',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL,
    'ST-004',
    'Frontend: 2FA setup flow',
    'Create UI for enabling 2FA: QR code display, backup codes, verification modal',
    'Todo', NULL,
    10.0, 10.0, 0.0, '2026-04-28', '2026-04-09T10:00:00+00:00', NULL
)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- SUBTASKS for ISSUES (Bug fix tracking) - SEPARATE INSERT with Deferred FK Checks
-- ==============================================================================

SET CONSTRAINTS ALL DEFERRED;

INSERT INTO horusvis."Subtasks" (
    "Id", "TaskId", "IssueId", "SubtaskCode", "Title", "Description", "State",
    "OwnerUserId", "EstimateHours", "ToDoHours", "ActualHours", "DueDate", "CreatedAt", "UpdatedAt"
) VALUES

-- Issue ISS-001: OAuth callback bug - Fix subtask (InProgress)
(
    'a0000005-0000-0000-0000-000000000005',
    NULL, 'f1111111-1111-1111-1111-111111111111',
    'ST-005',
    'Fix OAuth callback for Android',
    'Debug deep link configuration and update callback handler to properly handle manifest routing',
    'InProgress', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    8.0, 3.0, 2.5, '2026-04-14', '2026-04-08T16:30:00+00:00', '2026-04-08T18:00:00+00:00'
),

-- Issue ISS-003: Dashboard performance fix - completed (Completed)
(
    'a0000006-0000-0000-0000-000000000006',
    NULL, 'f3333333-3333-3333-3333-333333333333',
    'ST-006',
    'Optimize chart rendering performance',
    'Implement virtual scrolling and lazy loading for data visualization to handle large datasets',
    'Completed', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    10.0, 0.0, 12.0, '2026-03-25', '2026-03-16T09:00:00+00:00', '2026-03-28T15:30:00+00:00'
)
ON CONFLICT DO NOTHING;

SET CONSTRAINTS ALL IMMEDIATE;

-- ==============================================================================
-- VERIFICATION QUERIES
-- ==============================================================================

-- Count data by table
SELECT 
    'Tasks' as table_name, COUNT(*) as total_records
FROM horusvis."Tasks"
UNION ALL
SELECT 'Issues', COUNT(*) FROM horusvis."Issues"
UNION ALL
SELECT 'Subtasks', COUNT(*) FROM horusvis."Subtasks"
UNION ALL
SELECT 'FeatureAreas', COUNT(*) FROM horusvis."FeatureAreas"
ORDER BY table_name;

-- Task status distribution
SELECT 
    "Status",
    COUNT(*) as count
FROM horusvis."Tasks"
GROUP BY "Status"
ORDER BY "Status";

-- Issue workflow progression
SELECT 
    "WorkflowStage",
    COUNT(*) as count,
    STRING_AGG("IssueCode", ', ') as issue_codes
FROM horusvis."Issues"
GROUP BY "WorkflowStage"
ORDER BY "WorkflowStage";

-- Subtask state distribution
SELECT 
    "State",
    COUNT(*) as count
FROM horusvis."Subtasks"
GROUP BY "State"
ORDER BY "State";

-- Task with full details
SELECT 
    t."Title",
    t."Status",
    t."Priority",
    t."ProgressPercent",
    fa."AreaCode",
    p."ProjectKey",
    COUNT(DISTINCT s."Id") as subtask_count,
    COUNT(DISTINCT i."Id") as issue_count
FROM horusvis."Tasks" t
LEFT JOIN horusvis."FeatureAreas" fa ON t."FeatureAreaId" = fa."Id"
LEFT JOIN horusvis."Projects" p ON t."ProjectId" = p."Id"
LEFT JOIN horusvis."Subtasks" s ON t."Id" = s."TaskId"
LEFT JOIN horusvis."Issues" i ON t."Id" = i."TaskId"
GROUP BY t."Id", t."Title", t."Status", t."Priority", t."ProgressPercent", fa."AreaCode", p."ProjectKey"
ORDER BY t."CreatedAt" DESC;
