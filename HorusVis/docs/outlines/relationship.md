erDiagram
    %% ── GROUP 1: Identity / Permission ──
    Users {
        UUID Id PK
        varchar Username
        varchar Email
        varchar PasswordHash
        varchar FullName
        UUID RoleId FK
        varchar Status
        timestamptz CreatedAt
    }
    Roles {
        UUID Id PK
        varchar RoleCode
        varchar RoleName
    }
    Permissions {
        UUID Id PK
        varchar Scope
    }
    RolePermissions {
        UUID Id PK
        UUID RoleId FK
        UUID PermissionId FK
        timestamptz GrantedAt
    }
    UserSessions {
        UUID Id PK
        UUID UserId FK
        varchar RefreshTokenHash
        timestamptz RefreshTokenExpiresAt
        timestamptz RevokedAt
        varchar Status
    }

    %% ── GROUP 2: Projects ──
    Projects {
        UUID Id PK
        varchar ProjectKey
        varchar ProjectName
        UUID OwnerUserId FK
        varchar Status
        date StartDate
        date EndDate
    }
    Teams {
        UUID Id PK
        UUID ProjectId FK
        varchar TeamName
        UUID LeadUserId FK
        int VelocityTarget
        int CapacityLimit
    }
    ProjectMembers {
        UUID Id PK
        UUID ProjectId FK
        UUID UserId FK
        UUID TeamId FK
        varchar ProjectRole
        varchar MemberStatus
    }
    FeatureAreas {
        UUID Id PK
        UUID ProjectId FK
        varchar AreaCode
        varchar AreaName
    }

    %% ── GROUP 2.5: Sprints ──
    Sprints {
        UUID Id PK
        varchar SprintCode
        date StartDate
        date EndDate
        text Goal
    }

    %% ── GROUP 3: Tasks / Issues / Subtasks ──
    Tasks {
        UUID Id PK
        UUID ProjectId FK
        UUID FeatureAreaId FK
        UUID SprintId FK
        UUID CreatedByUserId FK
        varchar Title
        varchar Priority
        varchar Status
        text BlockedNote
        numeric PlanEstimate
        numeric ProgressPercent
        date DueDate
    }
    TaskAssignees {
        UUID Id PK
        UUID TaskId FK
        UUID UserId FK
        varchar AssignmentType
    }
    TaskComments {
        UUID Id PK
        UUID TaskId FK
        UUID UserId FK
        text Content
        timestamptz CreatedAt
    }
    Issues {
        UUID Id PK
        UUID ProjectId FK
        UUID TaskId FK
        UUID SprintId FK
        UUID ReporterUserId FK
        UUID CurrentAssigneeUserId FK
        UUID VerifiedByUserId FK
        varchar IssueCode
        varchar Severity
        varchar Priority
        varchar Status
        varchar WorkflowStage
        date DueDate
    }
    Subtasks {
        UUID Id PK
        UUID TaskId FK
        UUID IssueId FK
        UUID OwnerUserId FK
        varchar SubtaskCode
        varchar State
        numeric EstimateHours
        numeric ToDoHours
        numeric ActualHours
        date DueDate
    }
    IssueSteps {
        UUID Id PK
        UUID IssueId FK
        int StepOrder
        text ActionText
        text ExpectedResult
        text ActualResult
    }
    IssueActivities {
        UUID Id PK
        UUID IssueId FK
        UUID ChangedByUserId FK
        varchar ActivityType
        varchar FromValue
        varchar ToValue
        timestamptz ChangedAt
    }

    %% ── GROUP 4: Reports ──
    ReportSnapshots {
        UUID Id PK
        UUID ProjectId FK
        timestamptz SnapshotDate
        int TotalActiveBugs
        numeric AvgTimeToCloseHours
        numeric TaskVelocityPercent
        int CriticalPriorityCount
    }
    ReportBugDensityItems {
        UUID Id PK
        UUID SnapshotId FK
        UUID FeatureAreaId FK
        int BugCount
        numeric BugPercent
    }
    TeamPerformanceMetrics {
        UUID Id PK
        UUID SnapshotId FK
        UUID TeamId FK
        int CompletedPoints
        numeric CompletionSpeed
    }
    Recommendations {
        UUID Id PK
        UUID SnapshotId FK
        UUID ProjectId FK
        UUID AcceptedByUserId FK
        varchar Title
        varchar Status
    }

    %% ── GROUP 5: Admin / Ops ──
    Deployments {
        UUID Id PK
        varchar Environment
        varchar VersionLabel
        timestamptz StartedAt
        timestamptz FinishedAt
        varchar Status
        UUID TriggeredByUserId FK
    }
    SystemNodes {
        UUID Id PK
        varchar NodeName
        varchar Environment
        numeric CpuLoadPercent
        numeric MemoryLoadPercent
        varchar Status
        timestamptz LastHeartbeatAt
    }
    Notifications {
        UUID Id PK
        UUID UserId FK
        varchar Title
        varchar NotificationType
        boolean IsRead
        timestamptz CreatedAt
    }

    %% ═══ RELATIONSHIPS ═══

    %% Identity
    Users }o--|| Roles : "has role"
    Roles ||--o{ RolePermissions : "grants"
    Permissions ||--o{ RolePermissions : "assigned via"
    Users ||--o{ UserSessions : "has sessions"

    %% Projects
    Users ||--o{ Projects : "owns"
    Projects ||--o{ Teams : "has"
    Users ||--o{ Teams : "leads"
    Projects ||--o{ ProjectMembers : "has members"
    Users ||--o{ ProjectMembers : "is member"
    Teams ||--o{ ProjectMembers : "belongs to"
    Projects ||--o{ FeatureAreas : "divided into"

    %% Tasks
    Projects ||--o{ Tasks : "contains"
    FeatureAreas ||--o{ Tasks : "categorizes"
    Sprints ||--o{ Tasks : "groups"
    Users ||--o{ Tasks : "creates"
    Tasks ||--o{ TaskAssignees : "assigned to"
    Users ||--o{ TaskAssignees : "assigned as"
    Tasks ||--o{ TaskComments : "has comments"
    Users ||--o{ TaskComments : "writes"

    %% Issues
    Projects ||--o{ Issues : "contains"
    Tasks ||--o{ Issues : "has issues (nullable)"
    Sprints ||--o{ Issues : "groups"
    Users ||--o{ Issues : "reports"
    Issues ||--o{ IssueSteps : "reproduced by"
    Issues ||--o{ IssueActivities : "tracked by"
    Users ||--o{ IssueActivities : "changed by"

    %% Subtasks (polymorphic parent)
    Tasks ||--o{ Subtasks : "has subtasks"
    Issues ||--o{ Subtasks : "has subtasks"
    Users ||--o{ Subtasks : "owned by"

    %% Reports
    Projects ||--o{ ReportSnapshots : "snapshotted in"
    ReportSnapshots ||--o{ ReportBugDensityItems : "contains"
    FeatureAreas ||--o{ ReportBugDensityItems : "measured in"
    ReportSnapshots ||--o{ TeamPerformanceMetrics : "measures"
    Teams ||--o{ TeamPerformanceMetrics : "measured in"
    ReportSnapshots ||--o{ Recommendations : "generates"
    Users ||--o{ Recommendations : "accepts"

    %% Admin
    Users ||--o{ Deployments : "triggers"
    Users ||--o{ Notifications : "receives"
