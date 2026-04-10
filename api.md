# HorusVis API (v1)

Source:

- Swagger UI: http://localhost:5049/swagger/index.html
- OpenAPI JSON: http://localhost:5049/swagger/v1/swagger.json

Description: Scaffold API for HorusVis.
OpenAPI version: 3.0.4
Security: bearerAuth (JWT Bearer token)

## Tags

- Admin
- AdminMetrics
- AdminRoles
- AdminSessions
- AdminUsers
- Auth
- Deployments
- HorusVis.Web
- Issues
- MyTasks
- Projects
- Reports
- Sprints
- Subtasks
- Tasks

## Endpoints by Tag

### Admin

- GET /api/admin/placeholder

### AdminMetrics

- GET /api/admin/metrics
- GET /api/admin/nodes

### AdminRoles

- GET /api/admin/roles
- PUT /api/admin/roles/{roleId}

### AdminSessions

- GET /api/admin/sessions
- DELETE /api/admin/sessions/{sessionId}

### AdminUsers

- GET /api/admin/users
- POST /api/admin/users
- PUT /api/admin/users/{userId}

### Auth

- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/register

### Deployments

- GET /api/deployments

### HorusVis.Web

- GET /
- GET /health

### Issues

- POST /api/issues
- GET /api/issues/{issueId}
- PUT /api/issues/{issueId}
- GET /api/issues/{issueId}/subtasks
- POST /api/issues/{issueId}/subtasks

### MyTasks

- GET /api/my-tasks/board

### Projects

- GET /api/projects
- POST /api/projects
- GET /api/projects/{projectId}
- PUT /api/projects/{projectId}
- POST /api/projects/{projectId}/archive
- GET /api/projects/{projectId}/members
- POST /api/projects/{projectId}/members
- PUT /api/projects/{projectId}/members/{memberId}
- DELETE /api/projects/{projectId}/members/{memberId}
- GET /api/projects/{projectId}/feature-areas
- POST /api/projects/{projectId}/feature-areas
- DELETE /api/projects/{projectId}/feature-areas/{areaId}
- GET /api/projects/{projectId}/overview
- GET /api/projects/{projectId}/board-preview
- GET /api/projects/{projectId}/backlog
- GET /api/projects/{projectId}/board

### Reports

- GET /api/reports/dashboard
- GET /api/reports/bug-density
- GET /api/reports/team-performance
- GET /api/reports/critical-issues
- GET /api/reports/recommendations
- POST /api/reports/export

### Sprints

- GET /api/sprints
- GET /api/sprints/current
- GET /api/sprints/{id}
- GET /api/sprints/by-code/{code}
- GET /api/sprints/{id}/board
- POST /api/sprints/{id}/tasks/{taskId}
- DELETE /api/sprints/tasks/{taskId}
- POST /api/sprints/{id}/issues/{issueId}
- DELETE /api/sprints/issues/{issueId}

### Subtasks

- PUT /api/subtasks/{subtaskId}

### Tasks

- GET /api/tasks/my-board
- GET /api/tasks/feature-areas/{projectId}
- POST /api/tasks
- GET /api/tasks/{taskId}
- PUT /api/tasks/{taskId}
- GET /api/tasks/{taskId}/subtasks
- POST /api/tasks/{taskId}/subtasks
- GET /api/tasks/{taskId}/issues
- POST /api/tasks/{taskId}/issues
- GET /api/tasks/{taskId}/health
- GET /api/tasks/{taskId}/effort
- GET /api/tasks/{taskId}/burndown
- GET /api/tasks/{taskId}/dependencies
- GET /api/tasks/{taskId}/resources

## Schemas

The OpenAPI spec defines many schemas for requests and responses, including:

- ProjectListResponse, ProjectDetailResponse, ProjectOverviewDto
- TaskResponse, TaskDetailResponse, SubtaskResponse
- IssueResponse, IssueDetailResponse
- ReportDashboardDto, BugDensityItemDto, TeamPerformanceItemDto, CriticalIssueDto
- SprintDto, SprintBoardDto
- Create* and Update* request models for projects, tasks, issues, subtasks, users, and roles
