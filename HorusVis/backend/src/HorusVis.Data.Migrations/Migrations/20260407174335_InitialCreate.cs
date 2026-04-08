using HorusVis.Data.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HorusVis.Data.Migrations.Migrations;

/// <inheritdoc />
[DbContext(typeof(HorusVisDbContext))]
[Migration("20260407174335_InitialCreate")]
public class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(
            name: "horusvis");

        migrationBuilder.CreateTable(
            name: "Permissions",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Scope = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Description = table.Column<string>(type: "text", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Permissions", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Roles",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                RoleCode = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                RoleName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                Description = table.Column<string>(type: "text", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Roles", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "SystemNodes",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                NodeName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Environment = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                CpuLoadPercent = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                MemoryLoadPercent = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                Status = table.Column<string>(type: "text", nullable: false),
                LastHeartbeatAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SystemNodes", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "RolePermissions",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                PermissionId = table.Column<Guid>(type: "uuid", nullable: false),
                GrantedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_RolePermissions", x => x.Id);
                table.ForeignKey(
                    name: "FK_RolePermissions_Permissions_PermissionId",
                    column: x => x.PermissionId,
                    principalSchema: "horusvis",
                    principalTable: "Permissions",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_RolePermissions_Roles_RoleId",
                    column: x => x.RoleId,
                    principalSchema: "horusvis",
                    principalTable: "Roles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "Users",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                Email = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                PasswordHash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                FullName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                AvatarUrl = table.Column<string>(type: "text", nullable: true),
                Status = table.Column<string>(type: "text", nullable: false),
                LastLoginAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Users", x => x.Id);
                table.ForeignKey(
                    name: "FK_Users_Roles_RoleId",
                    column: x => x.RoleId,
                    principalSchema: "horusvis",
                    principalTable: "Roles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "Deployments",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Environment = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                VersionLabel = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                StartedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                FinishedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                Status = table.Column<string>(type: "text", nullable: false),
                TriggeredByUserId = table.Column<Guid>(type: "uuid", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Deployments", x => x.Id);
                table.ForeignKey(
                    name: "FK_Deployments_Users_TriggeredByUserId",
                    column: x => x.TriggeredByUserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "Notifications",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                Title = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                Body = table.Column<string>(type: "text", nullable: false),
                NotificationType = table.Column<string>(type: "text", nullable: false),
                IsRead = table.Column<bool>(type: "boolean", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Notifications", x => x.Id);
                table.ForeignKey(
                    name: "FK_Notifications_Users_UserId",
                    column: x => x.UserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "Projects",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProjectKey = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                ProjectName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                Description = table.Column<string>(type: "text", nullable: true),
                OwnerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                Status = table.Column<string>(type: "text", nullable: false),
                StartDate = table.Column<DateOnly>(type: "date", nullable: true),
                EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Projects", x => x.Id);
                table.ForeignKey(
                    name: "FK_Projects_Users_OwnerUserId",
                    column: x => x.OwnerUserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "UserSessions",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                RefreshTokenHash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                LastUsedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                RefreshTokenExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                RevokedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                Status = table.Column<string>(type: "text", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_UserSessions", x => x.Id);
                table.ForeignKey(
                    name: "FK_UserSessions_Users_UserId",
                    column: x => x.UserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "FeatureAreas",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                AreaCode = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                AreaName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                ColorHex = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                SortOrder = table.Column<int>(type: "integer", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_FeatureAreas", x => x.Id);
                table.ForeignKey(
                    name: "FK_FeatureAreas_Projects_ProjectId",
                    column: x => x.ProjectId,
                    principalSchema: "horusvis",
                    principalTable: "Projects",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ReportSnapshots",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProjectId = table.Column<Guid>(type: "uuid", nullable: true),
                SnapshotDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                TotalActiveBugs = table.Column<int>(type: "integer", nullable: false),
                AvgTimeToCloseHours = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                TaskVelocityPercent = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                CriticalPriorityCount = table.Column<int>(type: "integer", nullable: false),
                EfficiencyPercent = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                CapacityUsed = table.Column<int>(type: "integer", nullable: true),
                CapacityTotal = table.Column<int>(type: "integer", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ReportSnapshots", x => x.Id);
                table.ForeignKey(
                    name: "FK_ReportSnapshots_Projects_ProjectId",
                    column: x => x.ProjectId,
                    principalSchema: "horusvis",
                    principalTable: "Projects",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "Teams",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                TeamName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                LeadUserId = table.Column<Guid>(type: "uuid", nullable: true),
                VelocityTarget = table.Column<int>(type: "integer", nullable: true),
                CapacityLimit = table.Column<int>(type: "integer", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Teams", x => x.Id);
                table.ForeignKey(
                    name: "FK_Teams_Projects_ProjectId",
                    column: x => x.ProjectId,
                    principalSchema: "horusvis",
                    principalTable: "Projects",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_Teams_Users_LeadUserId",
                    column: x => x.LeadUserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "Tasks",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                FeatureAreaId = table.Column<Guid>(type: "uuid", nullable: true),
                Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Description = table.Column<string>(type: "text", nullable: true),
                Priority = table.Column<string>(type: "text", nullable: false),
                Status = table.Column<string>(type: "text", nullable: false),
                BlockedNote = table.Column<string>(type: "text", nullable: true),
                PlanEstimate = table.Column<decimal>(type: "numeric(5,1)", nullable: true),
                ProgressPercent = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                StartDate = table.Column<DateOnly>(type: "date", nullable: true),
                DueDate = table.Column<DateOnly>(type: "date", nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Tasks", x => x.Id);
                table.ForeignKey(
                    name: "FK_Tasks_FeatureAreas_FeatureAreaId",
                    column: x => x.FeatureAreaId,
                    principalSchema: "horusvis",
                    principalTable: "FeatureAreas",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_Tasks_Projects_ProjectId",
                    column: x => x.ProjectId,
                    principalSchema: "horusvis",
                    principalTable: "Projects",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_Tasks_Users_CreatedByUserId",
                    column: x => x.CreatedByUserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "Recommendations",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                SnapshotId = table.Column<Guid>(type: "uuid", nullable: false),
                ProjectId = table.Column<Guid>(type: "uuid", nullable: true),
                Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Description = table.Column<string>(type: "text", nullable: false),
                Source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                Status = table.Column<string>(type: "text", nullable: false),
                AcceptedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Recommendations", x => x.Id);
                table.ForeignKey(
                    name: "FK_Recommendations_Projects_ProjectId",
                    column: x => x.ProjectId,
                    principalSchema: "horusvis",
                    principalTable: "Projects",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_Recommendations_ReportSnapshots_SnapshotId",
                    column: x => x.SnapshotId,
                    principalSchema: "horusvis",
                    principalTable: "ReportSnapshots",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_Recommendations_Users_AcceptedByUserId",
                    column: x => x.AcceptedByUserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "ReportBugDensityItems",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                SnapshotId = table.Column<Guid>(type: "uuid", nullable: false),
                FeatureAreaId = table.Column<Guid>(type: "uuid", nullable: false),
                BugCount = table.Column<int>(type: "integer", nullable: false),
                BugPercent = table.Column<decimal>(type: "numeric(5,2)", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ReportBugDensityItems", x => x.Id);
                table.ForeignKey(
                    name: "FK_ReportBugDensityItems_FeatureAreas_FeatureAreaId",
                    column: x => x.FeatureAreaId,
                    principalSchema: "horusvis",
                    principalTable: "FeatureAreas",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_ReportBugDensityItems_ReportSnapshots_SnapshotId",
                    column: x => x.SnapshotId,
                    principalSchema: "horusvis",
                    principalTable: "ReportSnapshots",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ProjectMembers",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                TeamId = table.Column<Guid>(type: "uuid", nullable: true),
                ProjectRole = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                MemberStatus = table.Column<string>(type: "text", nullable: false),
                JoinedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ProjectMembers", x => x.Id);
                table.ForeignKey(
                    name: "FK_ProjectMembers_Projects_ProjectId",
                    column: x => x.ProjectId,
                    principalSchema: "horusvis",
                    principalTable: "Projects",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_ProjectMembers_Teams_TeamId",
                    column: x => x.TeamId,
                    principalSchema: "horusvis",
                    principalTable: "Teams",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_ProjectMembers_Users_UserId",
                    column: x => x.UserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "TeamPerformanceMetrics",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                SnapshotId = table.Column<Guid>(type: "uuid", nullable: false),
                TeamId = table.Column<Guid>(type: "uuid", nullable: false),
                CompletedPoints = table.Column<int>(type: "integer", nullable: false),
                CompletionSpeed = table.Column<decimal>(type: "numeric(10,2)", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_TeamPerformanceMetrics", x => x.Id);
                table.ForeignKey(
                    name: "FK_TeamPerformanceMetrics_ReportSnapshots_SnapshotId",
                    column: x => x.SnapshotId,
                    principalSchema: "horusvis",
                    principalTable: "ReportSnapshots",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_TeamPerformanceMetrics_Teams_TeamId",
                    column: x => x.TeamId,
                    principalSchema: "horusvis",
                    principalTable: "Teams",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "Issues",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                TaskId = table.Column<Guid>(type: "uuid", nullable: true),
                IssueCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Summary = table.Column<string>(type: "text", nullable: false),
                Severity = table.Column<string>(type: "text", nullable: false),
                Priority = table.Column<string>(type: "text", nullable: false),
                Status = table.Column<string>(type: "text", nullable: false),
                WorkflowStage = table.Column<string>(type: "text", nullable: false),
                ReporterUserId = table.Column<Guid>(type: "uuid", nullable: false),
                CurrentAssigneeUserId = table.Column<Guid>(type: "uuid", nullable: true),
                VerifiedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                DueDate = table.Column<DateOnly>(type: "date", nullable: true),
                OpenedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ResolvedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                ClosedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Issues", x => x.Id);
                table.ForeignKey(
                    name: "FK_Issues_Projects_ProjectId",
                    column: x => x.ProjectId,
                    principalSchema: "horusvis",
                    principalTable: "Projects",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_Issues_Tasks_TaskId",
                    column: x => x.TaskId,
                    principalSchema: "horusvis",
                    principalTable: "Tasks",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_Issues_Users_CurrentAssigneeUserId",
                    column: x => x.CurrentAssigneeUserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_Issues_Users_ReporterUserId",
                    column: x => x.ReporterUserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_Issues_Users_VerifiedByUserId",
                    column: x => x.VerifiedByUserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "TaskAssignees",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                TaskId = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                AssignmentType = table.Column<string>(type: "text", nullable: false),
                AssignedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_TaskAssignees", x => x.Id);
                table.ForeignKey(
                    name: "FK_TaskAssignees_Tasks_TaskId",
                    column: x => x.TaskId,
                    principalSchema: "horusvis",
                    principalTable: "Tasks",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_TaskAssignees_Users_UserId",
                    column: x => x.UserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "TaskComments",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                TaskId = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                Content = table.Column<string>(type: "text", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_TaskComments", x => x.Id);
                table.ForeignKey(
                    name: "FK_TaskComments_Tasks_TaskId",
                    column: x => x.TaskId,
                    principalSchema: "horusvis",
                    principalTable: "Tasks",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_TaskComments_Users_UserId",
                    column: x => x.UserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "IssueActivities",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                IssueId = table.Column<Guid>(type: "uuid", nullable: false),
                ActivityType = table.Column<string>(type: "text", nullable: false),
                FromValue = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                ToValue = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                Comment = table.Column<string>(type: "text", nullable: true),
                ChangedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                ChangedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_IssueActivities", x => x.Id);
                table.ForeignKey(
                    name: "FK_IssueActivities_Issues_IssueId",
                    column: x => x.IssueId,
                    principalSchema: "horusvis",
                    principalTable: "Issues",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_IssueActivities_Users_ChangedByUserId",
                    column: x => x.ChangedByUserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "IssueComments",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                IssueId = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                Content = table.Column<string>(type: "text", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_IssueComments", x => x.Id);
                table.ForeignKey(
                    name: "FK_IssueComments_Issues_IssueId",
                    column: x => x.IssueId,
                    principalSchema: "horusvis",
                    principalTable: "Issues",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_IssueComments_Users_UserId",
                    column: x => x.UserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "IssueSteps",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                IssueId = table.Column<Guid>(type: "uuid", nullable: false),
                StepOrder = table.Column<int>(type: "integer", nullable: false),
                ActionText = table.Column<string>(type: "text", nullable: false),
                ExpectedResult = table.Column<string>(type: "text", nullable: true),
                ActualResult = table.Column<string>(type: "text", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_IssueSteps", x => x.Id);
                table.ForeignKey(
                    name: "FK_IssueSteps_Issues_IssueId",
                    column: x => x.IssueId,
                    principalSchema: "horusvis",
                    principalTable: "Issues",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "Subtasks",
            schema: "horusvis",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                TaskId = table.Column<Guid>(type: "uuid", nullable: true),
                IssueId = table.Column<Guid>(type: "uuid", nullable: true),
                SubtaskCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Description = table.Column<string>(type: "text", nullable: true),
                State = table.Column<string>(type: "text", nullable: false),
                OwnerUserId = table.Column<Guid>(type: "uuid", nullable: true),
                EstimateHours = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                ToDoHours = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                ActualHours = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                DueDate = table.Column<DateOnly>(type: "date", nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Subtasks", x => x.Id);
                table.ForeignKey(
                    name: "FK_Subtasks_Issues_IssueId",
                    column: x => x.IssueId,
                    principalSchema: "horusvis",
                    principalTable: "Issues",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_Subtasks_Tasks_TaskId",
                    column: x => x.TaskId,
                    principalSchema: "horusvis",
                    principalTable: "Tasks",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_Subtasks_Users_OwnerUserId",
                    column: x => x.OwnerUserId,
                    principalSchema: "horusvis",
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Deployments_TriggeredByUserId",
            schema: "horusvis",
            table: "Deployments",
            column: "TriggeredByUserId");

        migrationBuilder.CreateIndex(
            name: "IX_FeatureAreas_ProjectId",
            schema: "horusvis",
            table: "FeatureAreas",
            column: "ProjectId");

        migrationBuilder.CreateIndex(
            name: "IX_IssueActivities_ChangedByUserId",
            schema: "horusvis",
            table: "IssueActivities",
            column: "ChangedByUserId");

        migrationBuilder.CreateIndex(
            name: "IX_IssueActivities_IssueId",
            schema: "horusvis",
            table: "IssueActivities",
            column: "IssueId");

        migrationBuilder.CreateIndex(
            name: "IX_IssueComments_IssueId",
            schema: "horusvis",
            table: "IssueComments",
            column: "IssueId");

        migrationBuilder.CreateIndex(
            name: "IX_IssueComments_UserId",
            schema: "horusvis",
            table: "IssueComments",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_Issues_CurrentAssigneeUserId",
            schema: "horusvis",
            table: "Issues",
            column: "CurrentAssigneeUserId");

        migrationBuilder.CreateIndex(
            name: "IX_Issues_IssueCode",
            schema: "horusvis",
            table: "Issues",
            column: "IssueCode",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Issues_ProjectId",
            schema: "horusvis",
            table: "Issues",
            column: "ProjectId");

        migrationBuilder.CreateIndex(
            name: "IX_Issues_ReporterUserId",
            schema: "horusvis",
            table: "Issues",
            column: "ReporterUserId");

        migrationBuilder.CreateIndex(
            name: "IX_Issues_TaskId",
            schema: "horusvis",
            table: "Issues",
            column: "TaskId");

        migrationBuilder.CreateIndex(
            name: "IX_Issues_VerifiedByUserId",
            schema: "horusvis",
            table: "Issues",
            column: "VerifiedByUserId");

        migrationBuilder.CreateIndex(
            name: "IX_IssueSteps_IssueId",
            schema: "horusvis",
            table: "IssueSteps",
            column: "IssueId");

        migrationBuilder.CreateIndex(
            name: "IX_Notifications_UserId",
            schema: "horusvis",
            table: "Notifications",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_Permissions_Scope",
            schema: "horusvis",
            table: "Permissions",
            column: "Scope",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_ProjectMembers_ProjectId",
            schema: "horusvis",
            table: "ProjectMembers",
            column: "ProjectId");

        migrationBuilder.CreateIndex(
            name: "IX_ProjectMembers_TeamId",
            schema: "horusvis",
            table: "ProjectMembers",
            column: "TeamId");

        migrationBuilder.CreateIndex(
            name: "IX_ProjectMembers_UserId",
            schema: "horusvis",
            table: "ProjectMembers",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_Projects_OwnerUserId",
            schema: "horusvis",
            table: "Projects",
            column: "OwnerUserId");

        migrationBuilder.CreateIndex(
            name: "IX_Projects_ProjectKey",
            schema: "horusvis",
            table: "Projects",
            column: "ProjectKey",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Recommendations_AcceptedByUserId",
            schema: "horusvis",
            table: "Recommendations",
            column: "AcceptedByUserId");

        migrationBuilder.CreateIndex(
            name: "IX_Recommendations_ProjectId",
            schema: "horusvis",
            table: "Recommendations",
            column: "ProjectId");

        migrationBuilder.CreateIndex(
            name: "IX_Recommendations_SnapshotId",
            schema: "horusvis",
            table: "Recommendations",
            column: "SnapshotId");

        migrationBuilder.CreateIndex(
            name: "IX_ReportBugDensityItems_FeatureAreaId",
            schema: "horusvis",
            table: "ReportBugDensityItems",
            column: "FeatureAreaId");

        migrationBuilder.CreateIndex(
            name: "IX_ReportBugDensityItems_SnapshotId",
            schema: "horusvis",
            table: "ReportBugDensityItems",
            column: "SnapshotId");

        migrationBuilder.CreateIndex(
            name: "IX_ReportSnapshots_ProjectId",
            schema: "horusvis",
            table: "ReportSnapshots",
            column: "ProjectId");

        migrationBuilder.CreateIndex(
            name: "IX_RolePermissions_PermissionId",
            schema: "horusvis",
            table: "RolePermissions",
            column: "PermissionId");

        migrationBuilder.CreateIndex(
            name: "IX_RolePermissions_RoleId",
            schema: "horusvis",
            table: "RolePermissions",
            column: "RoleId");

        migrationBuilder.CreateIndex(
            name: "IX_Subtasks_IssueId",
            schema: "horusvis",
            table: "Subtasks",
            column: "IssueId");

        migrationBuilder.CreateIndex(
            name: "IX_Subtasks_OwnerUserId",
            schema: "horusvis",
            table: "Subtasks",
            column: "OwnerUserId");

        migrationBuilder.CreateIndex(
            name: "IX_Subtasks_SubtaskCode",
            schema: "horusvis",
            table: "Subtasks",
            column: "SubtaskCode",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Subtasks_TaskId",
            schema: "horusvis",
            table: "Subtasks",
            column: "TaskId");

        migrationBuilder.CreateIndex(
            name: "IX_TaskAssignees_TaskId",
            schema: "horusvis",
            table: "TaskAssignees",
            column: "TaskId");

        migrationBuilder.CreateIndex(
            name: "IX_TaskAssignees_UserId",
            schema: "horusvis",
            table: "TaskAssignees",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_TaskComments_TaskId",
            schema: "horusvis",
            table: "TaskComments",
            column: "TaskId");

        migrationBuilder.CreateIndex(
            name: "IX_TaskComments_UserId",
            schema: "horusvis",
            table: "TaskComments",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_Tasks_CreatedByUserId",
            schema: "horusvis",
            table: "Tasks",
            column: "CreatedByUserId");

        migrationBuilder.CreateIndex(
            name: "IX_Tasks_FeatureAreaId",
            schema: "horusvis",
            table: "Tasks",
            column: "FeatureAreaId");

        migrationBuilder.CreateIndex(
            name: "IX_Tasks_ProjectId",
            schema: "horusvis",
            table: "Tasks",
            column: "ProjectId");

        migrationBuilder.CreateIndex(
            name: "IX_TeamPerformanceMetrics_SnapshotId",
            schema: "horusvis",
            table: "TeamPerformanceMetrics",
            column: "SnapshotId");

        migrationBuilder.CreateIndex(
            name: "IX_TeamPerformanceMetrics_TeamId",
            schema: "horusvis",
            table: "TeamPerformanceMetrics",
            column: "TeamId");

        migrationBuilder.CreateIndex(
            name: "IX_Teams_LeadUserId",
            schema: "horusvis",
            table: "Teams",
            column: "LeadUserId");

        migrationBuilder.CreateIndex(
            name: "IX_Teams_ProjectId",
            schema: "horusvis",
            table: "Teams",
            column: "ProjectId");

        migrationBuilder.CreateIndex(
            name: "IX_Users_Email",
            schema: "horusvis",
            table: "Users",
            column: "Email",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Users_RoleId",
            schema: "horusvis",
            table: "Users",
            column: "RoleId");

        migrationBuilder.CreateIndex(
            name: "IX_Users_Username",
            schema: "horusvis",
            table: "Users",
            column: "Username",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_UserSessions_UserId",
            schema: "horusvis",
            table: "UserSessions",
            column: "UserId");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "Deployments",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "IssueActivities",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "IssueComments",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "IssueSteps",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "Notifications",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "ProjectMembers",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "Recommendations",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "ReportBugDensityItems",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "RolePermissions",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "Subtasks",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "SystemNodes",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "TaskAssignees",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "TaskComments",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "TeamPerformanceMetrics",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "UserSessions",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "Permissions",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "Issues",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "ReportSnapshots",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "Teams",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "Tasks",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "FeatureAreas",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "Projects",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "Users",
            schema: "horusvis");

        migrationBuilder.DropTable(
            name: "Roles",
            schema: "horusvis");
    }
}
