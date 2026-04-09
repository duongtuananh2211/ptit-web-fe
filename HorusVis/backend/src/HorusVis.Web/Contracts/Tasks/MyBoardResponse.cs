namespace HorusVis.Web.Contracts.Tasks;

public sealed record MyBoardResponse(
    List<TaskResponse> TodoTasks,
    List<TaskResponse> WorkingTasks,
    List<TaskResponse> StuckTasks,
    List<TaskResponse> DoneTasks
);
