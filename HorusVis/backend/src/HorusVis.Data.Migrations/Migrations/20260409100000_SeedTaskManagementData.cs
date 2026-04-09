using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using HorusVis.Data.Persistence;

#nullable disable

namespace HorusVis.Data.Migrations.Migrations;

/// <inheritdoc />
[DbContext(typeof(HorusVisDbContext))]
[Migration("20260409100000_SeedTaskManagementData")]
public class SeedTaskManagementData : Migration
{
    // User IDs
    private static readonly Guid SuperAdminId = new("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");

    // Project IDs
    private static readonly Guid ProjectWebAppId = new("d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4");
    private static readonly Guid ProjectMobileId = new("e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5");
    private static readonly Guid ProjectDataEngineId = new("f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6");

    // FeatureArea IDs
    private static readonly Guid FeatureAuthId = new("11111111-1111-1111-1111-111111111111");
    private static readonly Guid FeatureDashboardId = new("22222222-2222-2222-2222-222222222222");
    private static readonly Guid FeatureReportingId = new("33333333-3333-3333-3333-333333333333");
    private static readonly Guid FeatureSyncId = new("44444444-4444-4444-4444-444444444444");
    private static readonly Guid FeatureImageProcessId = new("55555555-5555-5555-5555-555555555555");

    // Task IDs
    private static readonly Guid TaskOAuth2Id = new("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid TaskTwoFactorId = new("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid TaskDashboardUIId = new("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid TaskOfflineId = new("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid TaskPipelineId = new("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    // Issue IDs
    private static readonly Guid IssueOAuth2BugId = new("f1111111-1111-1111-1111-111111111111");
    private static readonly Guid IssueTokenExpiryId = new("f2222222-2222-2222-2222-222222222222");
    private static readonly Guid IssueDashboardPerfId = new("f3333333-3333-3333-3333-333333333333");

    // Subtask IDs
    private static readonly Guid SubtaskOAuth2IntegrationId = new("a0000001-0000-0000-0000-000000000001");
    private static readonly Guid SubtaskOAuth2TestsId = new("a0000002-0000-0000-0000-000000000002");
    private static readonly Guid SubtaskTwoFactorBackendId = new("a0000003-0000-0000-0000-000000000003");
    private static readonly Guid SubtaskTwoFactorUIId = new("a0000004-0000-0000-0000-000000000004");
    private static readonly Guid SubtaskOAuth2BugFixId = new("a0000005-0000-0000-0000-000000000005");
    private static readonly Guid SubtaskDashboardPerfFixId = new("a0000006-0000-0000-0000-000000000006");

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Insert FeatureAreas for WEBAPP project
        migrationBuilder.Sql($"""
            INSERT INTO horusvis."FeatureAreas" ("Id", "ProjectId", "AreaCode", "AreaName", "ColorHex") VALUES
            ('{FeatureAuthId}', '{ProjectWebAppId}', 'AUTH', 'Authentication & Security', '#FF6B6B'),
            ('{FeatureDashboardId}', '{ProjectWebAppId}', 'DASH', 'Dashboard & Analytics', '#4ECDC4'),
            ('{FeatureReportingId}', '{ProjectWebAppId}', 'REPORT', 'Reporting & Export', '#45B7D1')
            ON CONFLICT DO NOTHING;
            """);

        // Insert FeatureAreas for MOBILE project
        migrationBuilder.Sql($"""
            INSERT INTO horusvis."FeatureAreas" ("Id", "ProjectId", "AreaCode", "AreaName", "ColorHex") VALUES
            ('{FeatureSyncId}', '{ProjectMobileId}', 'SYNC', 'Data Synchronization', '#95E1D3'),
            ('{FeatureImageProcessId}', '{ProjectMobileId}', 'IMAGE', 'Image Processing', '#F38181')
            ON CONFLICT DO NOTHING;
            """);

        // Insert Tasks for WEBAPP project
        migrationBuilder.Sql($"""
            INSERT INTO horusvis."Tasks" (
                "Id", "ProjectId", "FeatureAreaId", "Title", "Description", 
                "Priority", "Status", "PlanEstimate", "ProgressPercent",
                "CreatedByUserId", "StartDate", "DueDate", "CreatedAt", "UpdatedAt"
            ) VALUES
            (
                '{TaskOAuth2Id}', '{ProjectWebAppId}', '{FeatureAuthId}',
                'Implement OAuth 2.0 Authentication',
                'Add OAuth 2.0 support with Google and GitHub providers. Implement callback handling, token storage, and session management.',
                'High', 'Working', 40.0, 75.0,
                '{SuperAdminId}', '2026-03-15', '2026-04-20', '2026-03-15T09:00:00+00:00', '2026-04-08T14:30:00+00:00'
            ),
            (
                '{TaskTwoFactorId}', '{ProjectWebAppId}', '{FeatureAuthId}',
                'Two-Factor Authentication Support',
                'Support TOTP (Time-based One-Time Password) and SMS-based 2FA. Integrate Authy API.',
                'Critical', 'ToDo', 25.0, 0.0,
                '{SuperAdminId}', '2026-04-09', '2026-05-15', '2026-04-09T10:00:00+00:00', NULL
            ),
            (
                '{TaskDashboardUIId}', '{ProjectWebAppId}', '{FeatureDashboardId}',
                'Dashboard Redesign - UI Overhaul',
                'Redesign dashboard layout for better UX. Implement responsive grid, improved charts, and real-time data widgets.',
                'Medium', 'Done', 32.0, 100.0,
                '{SuperAdminId}', '2026-01-20', '2026-03-31', '2026-01-20T08:30:00+00:00', '2026-03-31T16:45:00+00:00'
            ),
            (
                '{TaskOfflineId}', '{ProjectMobileId}', '{FeatureSyncId}',
                'Offline Mode & Data Synchronization',
                'Implement local database caching, background sync, and conflict resolution for offline-first mobile app.',
                'High', 'Working', 48.0, 50.0,
                '{SuperAdminId}', '2026-02-01', '2026-05-01', '2026-02-01T11:15:00+00:00', '2026-04-05T13:20:00+00:00'
            ),
            (
                '{TaskPipelineId}', '{ProjectDataEngineId}', NULL,
                'Data Processing Pipeline Optimization',
                'Optimize ETL pipeline for 10x throughput improvement. Implement parallel processing and caching.',
                'High', 'Stuck', 60.0, 40.0,
                '{SuperAdminId}', '2026-03-01', '2026-04-30', '2026-03-01T09:45:00+00:00', '2026-04-08T15:00:00+00:00'
            )
            ON CONFLICT DO NOTHING;
            """);

        // Insert Issues for WEBAPP project (linked to Tasks)
        migrationBuilder.Sql($"""
            INSERT INTO horusvis."Issues" (
                "Id", "ProjectId", "TaskId", "IssueCode", "Title", "Summary",
                "Severity", "Priority", "Status", "WorkflowStage",
                "ReporterUserId", "CurrentAssigneeUserId", "DueDate", "OpenedAt"
            ) VALUES
            (
                '{IssueOAuth2BugId}', '{ProjectWebAppId}', '{TaskOAuth2Id}',
                'ISS-001', 'OAuth callback not working with Android', 
                'OAuth callback handler returns 404 on Android devices. Works fine on web. Issue appears to be related to deep link configuration.',
                'Critical', 'High', 'Open', 'Triage',
                '{SuperAdminId}', NULL, '2026-04-12', '2026-04-07T16:30:00+00:00'
            ),
            (
                '{IssueTokenExpiryId}', '{ProjectWebAppId}', '{TaskOAuth2Id}',
                'ISS-002', 'Token expiry handling incomplete',
                'When OAuth token expires mid-session, user is not properly redirected to re-authenticate. Session becomes inconsistent.',
                'Major', 'High', 'Open', 'Debug',
                '{SuperAdminId}', NULL, '2026-04-15', '2026-04-08T10:15:00+00:00'
            ),
            (
                '{IssueDashboardPerfId}', '{ProjectWebAppId}', '{TaskDashboardUIId}',
                'ISS-003', 'Dashboard renders slowly on large datasets',
                'Dashboard with 500+ data points takes 8+ seconds to render. Charts are not responsive once rendered.',
                'Major', 'Medium', 'Resolved', 'Fixing',
                '{SuperAdminId}', NULL, '2026-03-28', '2026-03-15T13:45:00+00:00'
            )
            ON CONFLICT DO NOTHING;
            """);

        // Insert Subtasks for Tasks
        migrationBuilder.Sql($"""
            SET CONSTRAINTS ALL DEFERRED;
            INSERT INTO horusvis."Subtasks" (
                "Id", "TaskId", "IssueId", "SubtaskCode", "Title", "Description", "State",
                "OwnerUserId", "EstimateHours", "ToDoHours", "ActualHours", "DueDate", "CreatedAt", "UpdatedAt"
            ) VALUES
            (
                '{SubtaskOAuth2IntegrationId}', '{TaskOAuth2Id}', NULL,
                'ST-001', 'OAuth provider integration (Google)',
                'Set up Google OAuth app, implement authorization flow, and token handling',
                'Completed', '{SuperAdminId}', 16.0, 0.0, 18.5, '2026-03-25', '2026-03-15T09:00:00+00:00', '2026-03-25T17:00:00+00:00'
            ),
            (
                '{SubtaskOAuth2TestsId}', '{TaskOAuth2Id}', NULL,
                'ST-002', 'OAuth unit tests & edge cases',
                'Write comprehensive tests for OAuth flow including error scenarios',
                'InProgress', '{SuperAdminId}', 12.0, 4.0, 10.5, '2026-04-15', '2026-04-01T10:30:00+00:00', '2026-04-08T14:00:00+00:00'
            ),
            (
                '{SubtaskTwoFactorBackendId}', '{TaskTwoFactorId}', NULL,
                'ST-003', 'Backend: TOTP generation & verification',
                'Implement TOTP secret generation, QR code generation, and verification logic',
                'Defined', NULL, 12.0, 12.0, 0.0, '2026-04-25', '2026-04-09T10:00:00+00:00', NULL
            ),
            (
                '{SubtaskTwoFactorUIId}', '{TaskTwoFactorId}', NULL,
                'ST-004', 'Frontend: 2FA setup flow',
                'Create UI for enabling 2FA: QR code display, backup codes, verification modal',
                'Todo', NULL, 10.0, 10.0, 0.0, '2026-04-28', '2026-04-09T10:00:00+00:00', NULL
            )
            ON CONFLICT DO NOTHING;
            SET CONSTRAINTS ALL IMMEDIATE;
            """);

        // Insert Subtasks for Issues (separate call to ensure issues are committed first)
        migrationBuilder.Sql($"""
            SET CONSTRAINTS ALL DEFERRED;
            INSERT INTO horusvis."Subtasks" (
                "Id", "TaskId", "IssueId", "SubtaskCode", "Title", "Description", "State",
                "OwnerUserId", "EstimateHours", "ToDoHours", "ActualHours", "DueDate", "CreatedAt", "UpdatedAt"
            ) VALUES
            (
                '{SubtaskOAuth2BugFixId}', NULL, '{IssueOAuth2BugId}',
                'ST-005', 'Fix OAuth callback for Android',
                'Debug deep link configuration and update callback handler',
                'InProgress', '{SuperAdminId}', 8.0, 3.0, 2.5, '2026-04-14', '2026-04-08T16:30:00+00:00', '2026-04-08T18:00:00+00:00'
            ),
            (
                '{SubtaskDashboardPerfFixId}', NULL, '{IssueDashboardPerfId}',
                'ST-006', 'Optimize chart rendering performance',
                'Implement virtual scrolling and lazy loading for data visualization',
                'Completed', '{SuperAdminId}', 10.0, 0.0, 12.0, '2026-03-25', '2026-03-16T09:00:00+00:00', '2026-03-28T15:30:00+00:00'
            )
            ON CONFLICT DO NOTHING;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql($"""
            DELETE FROM horusvis."Subtasks" WHERE "SubtaskCode" IN ('ST-001', 'ST-002', 'ST-003', 'ST-004', 'ST-005', 'ST-006');
            DELETE FROM horusvis."Issues" WHERE "IssueCode" IN ('ISS-001', 'ISS-002', 'ISS-003');
            DELETE FROM horusvis."Tasks" WHERE "Id" IN (
                '{TaskOAuth2Id}', '{TaskTwoFactorId}', '{TaskDashboardUIId}', 
                '{TaskOfflineId}', '{TaskPipelineId}'
            );
            DELETE FROM horusvis."FeatureAreas" WHERE "AreaCode" IN ('AUTH', 'DASH', 'REPORT', 'SYNC', 'IMAGE');
            """);
    }
}
