using HorusVis.Data.Horusvis.Entities;

namespace HorusVis.Business.Contracts;

public interface IIssuesService
{
    /// <summary>
    /// Create a new issue
    /// </summary>
    Task<Issue> CreateIssueAsync(Guid projectId, string title, string summary, string severity, string priority, Guid reporterUserId, Guid? taskId = null, DateOnly? dueDate = null, CancellationToken ct = default);

    /// <summary>
    /// Get issue details with related subtasks
    /// </summary>
    Task<(Issue Issue, List<Subtask> Subtasks)?> GetIssueDetailAsync(Guid issueId, CancellationToken ct = default);

    /// <summary>
    /// Update issue
    /// </summary>
    Task<Issue> UpdateIssueAsync(Guid issueId, string title, string summary, string status, string severity, string priority, string workflowStage, Guid? currentAssigneeUserId = null, Guid? verifiedByUserId = null, DateOnly? dueDate = null, CancellationToken ct = default);

    /// <summary>
    /// Get subtasks by issue ID
    /// </summary>
    Task<List<Subtask>> GetIssueSubtasksAsync(Guid issueId, CancellationToken ct = default);

    /// <summary>
    /// Get next available issue code for a project
    /// </summary>
    Task<string> GetNextIssueCodeAsync(Guid projectId, CancellationToken ct = default);
}
