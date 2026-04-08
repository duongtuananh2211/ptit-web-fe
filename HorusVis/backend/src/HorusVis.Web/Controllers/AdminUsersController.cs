using HorusVis.Business.Contracts;
using HorusVis.Business.Contracts.Admin;
using HorusVis.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize(Roles = "admin")]
[Route("api/admin/users")]
public sealed class AdminUsersController(
    IAdministrationService adminService,
    IUnitOfWorkService unitOfWork) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> ListUsers(
        [FromQuery] Guid? cursor,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        if (pageSize is < 1 or > 100) pageSize = 20;
        var result = await adminService.ListUsersAsync(cursor, pageSize, ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser(
        [FromBody] CreateUserRequest request,
        CancellationToken ct = default)
    {
        var dto = await adminService.CreateUserAsync(request, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(ListUsers), new { }, dto);
    }

    [HttpPut("{userId:guid}")]
    public async Task<IActionResult> UpdateUser(
        Guid userId,
        [FromBody] UpdateUserRequest request,
        CancellationToken ct = default)
    {
        var dto = await adminService.UpdateUserAsync(userId, request, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return Ok(dto);
    }
}
