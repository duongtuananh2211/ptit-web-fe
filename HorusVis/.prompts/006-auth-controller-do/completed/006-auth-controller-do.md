# Prompt: Implement Auth Controller — Phase 4 of 5

## Metadata
- **Purpose**: Do
- **Topic**: auth-controller
- **Phase**: 4 of 5 (auth implementation)
- **References**: `.prompts/002-auth-jwt-plan/auth-jwt-plan.md`, `.prompts/001-auth-jwt-research/auth-jwt-research.md`
- **Depends on**: Phase 3 (`IAuthService` with RefreshAsync/LogoutAsync fully implemented)
- **SUMMARY**: `.prompts/006-auth-controller-do/SUMMARY.md`

---

<objective>
Implement `AuthController` in `HorusVis.Web` exposing four endpoints: login, refresh, logout, register. The refresh token is delivered **exclusively** via an httpOnly cookie — never in the JSON response body. The access token is returned in the JSON response.

**Security requirement**: The raw refresh token must never appear in a JSON response body or in server-side logs.
</objective>

<context>
Plan: @.prompts/002-auth-jwt-plan/auth-jwt-plan.md (Phase 4 details)
Research: @.prompts/001-auth-jwt-research/auth-jwt-research.md (token storage section, cookie configuration)

Relevant project files to read before implementing:
- `backend/src/HorusVis.Business/Contracts/IAuthService.cs` — interface to call
- `backend/src/HorusVis.Business/Contracts/AuthResult.cs` — return type from AuthService
- `backend/src/HorusVis.Web/Controllers/` — read an existing controller to match patterns (routing style, base class, DI pattern)
- `backend/src/HorusVis.Web/Program.cs` — see existing CORS policy name and middleware order; will need to add IAuthService registration
- `backend/src/HorusVis.Web/HorusVis.Web.csproj` — confirm project reference to HorusVis.Business
</context>

<requirements>
1. **Request/Response DTOs** in `HorusVis.Web/Contracts/`:
   ```csharp
   // LoginRequest.cs
   public record LoginRequest(string UsernameOrEmail, string Password);

   // RegisterRequest.cs
   public record RegisterRequest(string Username, string Email, string FullName, string Password);

   // LoginResponse.cs
   public record LoginResponse(string AccessToken, DateTimeOffset ExpiresAt);
   ```

2. **AuthController** at route `api/auth`:
   ```
   POST /api/auth/login
   POST /api/auth/refresh
   POST /api/auth/logout
   POST /api/auth/register
   ```
   - All endpoints are anonymous (no `[Authorize]`)
   - Returns `ProblemDetails` for errors (use `Problem()` helper)

3. **POST /api/auth/login** implementation:
   - Accept `[FromBody] LoginRequest request`
   - Validate model (400 if invalid)
   - Call `IAuthService.LoginAsync(request.UsernameOrEmail, request.Password, ct)`
   - Set httpOnly cookie:
     ```csharp
     Response.Cookies.Append("refresh_token", result.RawRefreshToken, new CookieOptions
     {
         HttpOnly = true,
         Secure = true,
         SameSite = SameSiteMode.Strict,
         Expires = result.RefreshTokenExpiresAt,
         Path = "/api/auth"   // restrict cookie to auth endpoints only
     });
     ```
   - Return `Ok(new LoginResponse(result.AccessToken, result.AccessTokenExpiresAt))`
   - Catch `UnauthorizedAccessException` → return `Unauthorized(Problem(...))`

4. **POST /api/auth/refresh** implementation:
   - Read cookie: `var rawToken = Request.Cookies["refresh_token"]`
   - If null/empty → return `Unauthorized(Problem("No refresh token provided"))`
   - Call `IAuthService.RefreshAsync(rawToken, ct)`
   - Set new cookie (same options as login) with new token and expiry
   - Return `Ok(new LoginResponse(result.AccessToken, result.AccessTokenExpiresAt))`
   - Catch `UnauthorizedAccessException` → clear cookie + return `Unauthorized(Problem(...))`

5. **POST /api/auth/logout** implementation:
   - Read cookie: `var rawToken = Request.Cookies["refresh_token"]`
   - If not null, call `IAuthService.LogoutAsync(rawToken, ct)` (swallow exceptions — idempotent)
   - Delete cookie:
     ```csharp
     Response.Cookies.Delete("refresh_token", new CookieOptions { Path = "/api/auth" });
     ```
   - Return `NoContent()` (204)

6. **POST /api/auth/register** implementation:
   - Accept `[FromBody] RegisterRequest request`
   - Call `IAuthService.RegisterAsync(request.Username, request.Email, request.FullName, request.Password, ct)`
   - Return `Created()` (201) — or `CreatedAtAction` if a `GET /api/users/{id}` exists
   - Catch `InvalidOperationException` → return `Conflict(Problem(...))`

7. **Register IAuthService in Program.cs**:
   - Add `builder.Services.AddScoped<IAuthService, AuthService>()` — OR call the method from `HorusVis.Business.ServiceCollectionExtensions` if it already registers everything

8. **Input validation**: Add `[Required]` / `[MinLength]` / `[EmailAddress]` data annotations to DTOs where appropriate
</requirements>

<implementation>
- Cookie Path is `/api/auth` — this prevents the refresh token cookie from being sent to non-auth endpoints, reducing the attack surface
- Do NOT log or include `RawRefreshToken` in any exception messages or structured logs
- Use `CancellationToken ct` parameter on all action methods
- Match the existing controller pattern (look at existing controllers for base class, route attribute style, etc.)
- If 'HorusVis.Web.csproj' doesn't reference 'HorusVis.Business', add the ProjectReference (it likely already does — verify first)
</implementation>

<verification>
Before declaring complete:
- [ ] `LoginRequest.cs`, `RegisterRequest.cs`, `LoginResponse.cs` exist in `HorusVis.Web/Contracts/`
- [ ] `AuthController.cs` exists with all 4 endpoints
- [ ] Login sets httpOnly cookie with `Path = "/api/auth"`
- [ ] Refresh reads cookie and sets a NEW cookie (rotation)
- [ ] Logout clears cookie with same Path option
- [ ] `RawRefreshToken` is never serialized to JSON (not in `LoginResponse`)
- [ ] `Program.cs` registers `IAuthService` (or `ServiceCollectionExtensions` call covers it)
- [ ] All error cases return `ProblemDetails`-shaped responses
- [ ] `UnauthorizedAccessException` → 401; `InvalidOperationException` (duplicate user) → 409
</verification>

<output>
Files to create:
- `backend/src/HorusVis.Web/Contracts/LoginRequest.cs`
- `backend/src/HorusVis.Web/Contracts/RegisterRequest.cs`
- `backend/src/HorusVis.Web/Contracts/LoginResponse.cs`
- `backend/src/HorusVis.Web/Controllers/AuthController.cs`

Files to modify:
- `backend/src/HorusVis.Web/Program.cs` (register IAuthService if not already done via ServiceCollectionExtensions)

After all files are written, create `SUMMARY.md`:
```markdown
# Auth Controller Summary

**AuthController implemented with POST /api/auth/{login,refresh,logout,register}; refresh token delivered exclusively via httpOnly SameSite=Strict cookie scoped to /api/auth path; access token in JSON; error responses use ProblemDetails.**

## Version
v1

## Files Created
- `backend/src/HorusVis.Web/Contracts/LoginRequest.cs`
- `backend/src/HorusVis.Web/Contracts/RegisterRequest.cs`
- `backend/src/HorusVis.Web/Contracts/LoginResponse.cs`
- `backend/src/HorusVis.Web/Controllers/AuthController.cs`

## Files Modified
- `backend/src/HorusVis.Web/Program.cs`

## Decisions Needed
None

## Blockers
Phase 3 (RefreshAsync/LogoutAsync on IAuthService) must be complete

## Next Step
Run Phase 5: reduce token lifetime to 15 min, env-conditional HTTPS, CORS AllowCredentials

---
*Confidence: High*
*Full output: see Files Created above*
```
</output>
