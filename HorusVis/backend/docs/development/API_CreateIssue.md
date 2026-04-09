# Issues API - Create Issue Endpoint

## Overview
Added POST endpoint `POST /api/issues` to create a new issue, with optional attachment to a task.

## Endpoint Details

### Create Issue
**URL**: `POST /api/issues`

**Authentication**: Required (Bearer Token)

**Request Body**:
```json
{
  "projectId": "uuid",
  "title": "string",
  "summary": "string",
  "severity": "Low|Medium|High|Critical",
  "priority": "Low|Medium|High|Critical",
  "taskId": "uuid or null",
  "dueDate": "2026-04-15 or null"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "issueCode": "ISS-001",
  "title": "string",
  "summary": "string",
  "severity": "Critical",
  "priority": "High",
  "status": "Triage",
  "workflowStage": "Triage",
  "reporterUserId": "uuid",
  "currentAssigneeUserId": "uuid or null",
  "verifiedByUserId": "uuid or null",
  "dueDate": "2026-04-15 or null",
  "openedAt": "2026-04-09T10:30:00+00:00",
  "resolvedAt": "2026-04-09T15:45:00+00:00 or null",
  "closedAt": "2026-04-09T16:00:00+00:00 or null",
  "taskId": "uuid or null"
}
```

## Usage Examples

### 1. Create Standalone Issue (Bug Report)
```bash
curl -X POST http://localhost:5000/api/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "projectId": "d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4",
    "title": "Login button not working on mobile",
    "summary": "The primary login button is unresponsive on iOS Safari. Users cannot proceed past the login screen.",
    "severity": "Critical",
    "priority": "High",
    "taskId": null,
    "dueDate": "2026-04-12"
  }'
```

### 2. Create Issue Attached to Task
```bash
curl -X POST http://localhost:5000/api/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "projectId": "d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4",
    "title": "Database connection drops under load",
    "summary": "Connection pooling not handling concurrent requests properly during stress tests. Connections timeout after 30 concurrent requests.",
    "severity": "High",
    "priority": "Critical",
    "taskId": "d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4",
    "dueDate": "2026-04-10"
  }'
```

### 3. Create Issue Without Due Date
```bash
curl -X POST http://localhost:5000/api/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "projectId": "e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5",
    "title": "Performance improvement: API response time",
    "summary": "GET /api/tasks endpoint takes 500ms. Should be optimized to < 200ms.",
    "severity": "Medium",
    "priority": "Medium",
    "taskId": "e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5"
  }'
```

## Field Descriptions

| Field | Type | Required | Description |
|---|---|---|---|
| **projectId** | UUID | ✅ | Project where the issue belongs |
| **title** | String | ✅ | Issue title (e.g., "Bug in authentication") |
| **summary** | String | ✅ | Detailed description of the issue |
| **severity** | Enum | ✅ | Low, Medium, High, Critical |
| **priority** | Enum | ✅ | Low, Medium, High, Critical |
| **taskId** | UUID \| null | ❌ | Optional - Link issue to a specific task |
| **dueDate** | Date \| null | ❌ | Optional - Target resolution date (ISO format) |

## Behavior

### Auto-generated Fields
- **issueCode**: Auto-generated in format ISS-001, ISS-002, etc.
- **status**: Defaults to "Triage"
- **workflowStage**: Defaults to "Triage"
- **reporterUserId**: Automatically set to the authenticated user
- **openedAt**: Set to current UTC timestamp

### Validation
- ProjectId must exist and be valid
- TaskId (if provided) must exist and belong to the same project
- Severity and Priority must be valid enum values
- DueDate must be valid ISO date format (YYYY-MM-DD)

### Response Headers
```
Location: /api/issues/{issueId}
Content-Type: application/json
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "ProjectId is invalid",
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or missing authorization token",
  "statusCode": 401
}
```

### 404 Not Found
```json
{
  "error": "Project not found",
  "statusCode": 404
}
```

### 422 Unprocessable Entity
```json
{
  "error": "Task belongs to a different project",
  "statusCode": 422
}
```

## Integration with Task Management

When creating an issue with a TaskId:
1. **Automatic Status Sync**: If task has status "Done", it will be changed to "Working" (task can't be done if there are critical issues)
2. **Progress Recalculation**: Task progress percentage is recalculated
3. **Block Detection**: If issue severity is "Critical", task may be marked as "Stuck"
4. **Notification**: Task owner is notified of the critical issue

## Related Endpoints

- **GET** `/api/issues/{issueId}` - Get issue details
- **PUT** `/api/issues/{issueId}` - Update issue
- **GET** `/api/issues/{issueId}/subtasks` - Get issue subtasks
- **POST** `/api/issues/{issueId}/subtasks` - Create subtask for issue
- **GET** `/api/tasks/{taskId}/issues` - Get all issues for a task

## Implementation Details

**Location**: [IssuesController.cs](../src/HorusVis.Web/Controllers/IssuesController.cs#L18)

**Service Call**: `IIssuesService.CreateIssueAsync()`

**Request Contract**: [CreateIssueRequest.cs](../src/HorusVis.Web/Contracts/Issues/CreateIssueRequest.cs)

**Response Contract**: [IssueResponse.cs](../src/HorusVis.Web/Contracts/Issues/IssueResponse.cs)
