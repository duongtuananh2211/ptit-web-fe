# Prompt: Implement Auth Service (Login + Register) — Phase 2 of 5

## Metadata
- **Purpose**: Do
- **Topic**: auth-login-register
- **Phase**: 2 of 5 (auth implementation)
- **References**: `.prompts/002-auth-jwt-plan/auth-jwt-plan.md`, `.prompts/001-auth-jwt-research/auth-jwt-research.md`
- **Depends on**: Phase 1 (`IPasswordService` must exist)
- **SUMMARY**: `.prompts/004-auth-login-register-do/SUMMARY.md`

---

<objective>
Implement `IAuthService` and `AuthService` in `HorusVis.Business` covering the login and register flows. `AuthService` orchestrates `IPasswordService` (Phase 1) and the existing `IJwtTokenService`.

**Purpose**: Provides the business logic for authenticating users and creating accounts, to be called by the auth controller in Phase 4.
</objective>

<context>
Plan: @.prompts/002-auth-jwt-plan/auth-jwt-plan.md (Phase 2 details)
Research: @.prompts/001-auth-jwt-research/auth-jwt-research.md (login flow, claims design)

Relevant project files to read before implementing:
- `backend/src/HorusVis.Business/Contracts/IPasswordService.cs` — from Phase 1 (must exist)
- `backend/src/HorusVis.Web/Services/Authentication/IJwtTokenService.cs` — existing token service interface
- `backend/src/HorusVis.Web/Services/Authentication/JwtTokenService.cs` — see how token is generated; note what claims it uses
- `backend/src/HorusVis.Business/ServiceCollectionExtensions.cs` — existing DI pattern
- `backend/src/HorusVis.Data/Horusvis/Entities/User.cs` — User entity fields
- `backend/src/HorusVis.Data/Horusvis/Entities/Role.cs` — Role entity
- `backend/src/HorusVis.Data/Persistence/HorusVisDbContext.cs` — DbContext DbSets

Note: `IJwtTokenService` lives in `HorusVis.Web`. `AuthService` will be in `HorusVis.Business`. Check if `HorusVis.Business.csproj` already references `HorusVis.Web` — if not, consider either moving `IJwtTokenService` to `HorusVis.Core` or `HorusVis.Business`, or having `AuthService` accept it via a local interface in Business that Web implements. Read the existing project references before deciding.
</context>

<requirements>
1. **AuthResult record** in `HorusVis.Business/Contracts/`:
   ```csharp
   public record AuthResult(
       string AccessToken,
       DateTimeOffset AccessTokenExpiresAt,
       string RawRefreshToken,           // raw value for cookie — NOT stored in DB
       DateTimeOffset RefreshTokenExpiresAt
   );
   ```

2. **IAuthService** interface in `HorusVis.Business/Contracts/`:
   ```csharp
   Task<AuthResult> LoginAsync(string usernameOrEmail, string password, CancellationToken ct = default);
   Task RegisterAsync(string username, string email, string fullName, string password, CancellationToken ct = default);
   Task<AuthResult> RefreshAsync(string rawRefreshToken, CancellationToken ct = default);   // stub for Phase 3
   Task LogoutAsync(string rawRefreshToken, CancellationToken ct = default);                // stub for Phase 3
   ```

3. **AuthService** implementation in `HorusVis.Business/Services/`:
   - **LoginAsync**:
     1. Find user by `Username == usernameOrEmail OR Email == usernameOrEmail` (case-insensitive) via DbContext
     2. If not found or `VerifyPassword` returns false → throw `UnauthorizedAccessException("Invalid credentials")`
     3. Load user's `Role` via navigation property or separate query
     4. Call `IJwtTokenService` to generate access token with user claims
     5. Create a `UserSession` with `RefreshTokenHash = ""` and `Status = Active`, `RefreshTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(14)` — Phase 3 will fill in the actual hash; for now return a placeholder `RawRefreshToken = Guid.NewGuid().ToString()`
     6. Save `UserSession` to DbContext
     7. Return `AuthResult` with access token + placeholder refresh token
   - **RegisterAsync**:
     1. If user with same `Username` or `Email` already exists → throw `InvalidOperationException("Username or email already taken")`
     2. Look up the default "User" role (RoleCode = "user", case-insensitive) from the database
     3. Hash password using `IPasswordService.HashPassword`
     4. Create new `User` entity with `CreatedAt = DateTimeOffset.UtcNow`, `Status = Active`
     5. Save to DbContext
   - **RefreshAsync** / **LogoutAsync**: throw `NotImplementedException("Implemented in Phase 3")` for now

4. **DI Registration** in `ServiceCollectionExtensions.cs`:
   - Register `IAuthService` → `AuthService` as Scoped
   - Ensure `HorusVisDbContext` is already registered (it should be — verify)

5. **Unit tests** in `backend/tests/HorusVis.Business.Tests/AuthServiceTests.cs`:
   - Use `InMemory` EF Core provider for tests
   - Test: `LoginAsync_WithValidCredentials_ReturnsAccessToken`
   - Test: `LoginAsync_WithInvalidPassword_ThrowsUnauthorized`
   - Test: `LoginAsync_WithUnknownUser_ThrowsUnauthorized`
   - Test: `RegisterAsync_WithNewUser_CreatesUserWithHashedPassword`
   - Test: `RegisterAsync_WithDuplicateUsername_Throws`
   - Mock `IPasswordService` and `IJwtTokenService` using Moq (or NSubstitute if that's what the project uses — check the test csproj)
</requirements>

<implementation>
- Do NOT expose `RawRefreshToken` to the controller as a JSON field — it only flows through `AuthResult` to be set as a cookie
- Use `.AsNoTracking()` for read queries where you won't be updating the entity
- Throw standard exceptions (not custom) for now — the controller will map them to HTTP responses (Phase 4)
- Match existing namespace conventions
- If `IJwtTokenService` is not accessible from `HorusVis.Business`, define a minimal `ITokenGenerator` interface in `HorusVis.Business/Contracts/` with just `string GenerateToken(User user, string role)` and have `JwtTokenService` implement it (modify `JwtTokenService` to also implement this new interface)
</implementation>

<verification>
Before declaring complete:
- [ ] `AuthResult.cs` exists in `Contracts/`
- [ ] `IAuthService.cs` exists in `Contracts/`
- [ ] `AuthService.cs` exists in `Services/`
- [ ] `AuthServiceTests.cs` exists with ≥5 test methods
- [ ] `ServiceCollectionExtensions.cs` registers `IAuthService`
- [ ] No circular project references introduced
- [ ] `LoginAsync` finds user by both username and email
- [ ] `RegisterAsync` checks for duplicate username AND email before creating user
</verification>

<output>
Files to create:
- `backend/src/HorusVis.Business/Contracts/AuthResult.cs`
- `backend/src/HorusVis.Business/Contracts/IAuthService.cs`
- `backend/src/HorusVis.Business/Services/AuthService.cs`
- `backend/tests/HorusVis.Business.Tests/AuthServiceTests.cs`

Files to modify:
- `backend/src/HorusVis.Business/ServiceCollectionExtensions.cs`
- `backend/src/HorusVis.Web/Services/Authentication/JwtTokenService.cs` (only if interface extraction needed)

After all files are written, create `SUMMARY.md`:
```markdown
# Auth Login/Register Summary

**IAuthService + AuthService implemented with LoginAsync (username/email lookup, password verify, JWT issue) and RegisterAsync (duplicate check, password hash, user create); 5 unit tests; Phase 3 stubs in place.**

## Version
v1

## Files Created
- `backend/src/HorusVis.Business/Contracts/AuthResult.cs`
- `backend/src/HorusVis.Business/Contracts/IAuthService.cs`
- `backend/src/HorusVis.Business/Services/AuthService.cs`
- `backend/tests/HorusVis.Business.Tests/AuthServiceTests.cs`

## Files Modified
- `backend/src/HorusVis.Business/ServiceCollectionExtensions.cs`
- [list any other files modified and why]

## Decisions Needed
- Confirm default role RoleCode for new registrations (assumed "user" — must exist in DB)

## Blockers
None (Phase 1 IPasswordService must be implemented first)

## Next Step
Run Phase 3: implement refresh token rotation with IRefreshTokenService and family invalidation

---
*Confidence: High*
*Full output: see Files Created above*
```
</output>
