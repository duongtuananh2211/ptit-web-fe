using HorusVis.Business.Contracts;
using HorusVis.Business.Contracts.Admin;
using HorusVis.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HorusVis.Web.Controllers;

[ApiController]
[Authorize(Roles = "admin")]
[Route("api/admin/roles")]
public sealed class AdminRolesController(
    IAdministrationService adminService,
    IUnitOfWorkService unitOfWork) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> ListRoles(CancellationToken ct = default)
    {
        var roles = await adminService.ListRolesAsync(ct);
        return Ok(roles);
    }

    [HttpPut("{roleId:guid}")]
    public async Task<IActionResult> UpdateRolePermissions(
        Guid roleId,
        [FromBody] UpdateRoleRequest request,
        CancellationToken ct = default)
    {
        await adminService.UpdateRolePermissionsAsync(roleId, request.PermissionScopes, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return Ok();
    }
}
