# Prompt: Implement Refresh Token Rotation — Phase 3 of 5

## Metadata
- **Purpose**: Do
- **Topic**: auth-refresh-rotation
- **Phase**: 3 of 5 (auth implementation)
- **References**: `.prompts/002-auth-jwt-plan/auth-jwt-plan.md`, `.prompts/001-auth-jwt-research/auth-jwt-research.md`
- **Depends on**: Phase 2 (`IAuthService` stub must exist)
- **SUMMARY**: `.prompts/005-auth-refresh-rotation-do/SUMMARY.md`

---

<objective>
Implement `IRefreshTokenService` + `RefreshTokenService` for secure token generation and hashing. Fully implement `AuthService.RefreshAsync` and `AuthService.LogoutAsync` replacing the Phase 2 stubs. Implement refresh token rotation with **family invalidation** (reuse attack detection).

**Security critical**: A replayed (stolen) refresh token must revoke ALL sessions for that user.
</objective>

<context>
Plan: @.prompts/002-auth-jwt-plan/auth-jwt-plan.md (Phase 3 details)
Research: @.prompts/001-auth-jwt-research/auth-jwt-research.md (refresh token rotation section, reuse detection)

Relevant project files to read before implementing:
- `backend/src/HorusVis.Business/Services/AuthService.cs` — Phase 2 implementation (has stubs for RefreshAsync/LogoutAsync)
- `backend/src/HorusVis.Business/Contracts/IAuthService.cs` — existing interface
- `backend/src/HorusVis.Business/Contracts/AuthResult.cs` — existing record
- `backend/src/HorusVis.Data/Horusvis/Entities/UserSession.cs` — session entity fields
- `backend/src/HorusVis.Data/Persistence/HorusVisDbContext.cs` — verify UserSession DbSet name
</context>

<requirements>
1. **IRefreshTokenService** in `HorusVis.Business/Contracts/`:
   ```csharp
   string GenerateRawToken();          // 64 cryptographically random bytes as Base64Url
   string HashToken(string rawToken);  // SHA-256 hex string of the raw token bytes
   ```

2. **RefreshTokenService** in `HorusVis.Business/Services/`:
   - `GenerateRawToken()`: use `RandomNumberGenerator.GetBytes(64)`, return `Convert.ToBase64String(bytes)` (or Base64Url-encode)
   - `HashToken(string rawToken)`: decode the Base64 bytes, compute `SHA256.HashData(bytes)`, return lowercase hex string: `Convert.ToHexString(hash).ToLowerInvariant()`
   - Register as `AddSingleton<IRefreshTokenService, RefreshTokenService>()` in `ServiceCollectionExtensions.cs`

3. **Update `AuthService.LoginAsync`** to use real refresh tokens:
   - Call `IRefreshTokenService.GenerateRawToken()` to get raw token
   - Call `IRefreshTokenService.HashToken(rawToken)` to get the hash
   - Store hash in `UserSession.RefreshTokenHash`
   - Set `UserSession.CreatedAt = DateTimeOffset.UtcNow`
   - Set `UserSession.RefreshTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(14)`
   - Set `UserSession.Status = "Active"` (match existing Status field type — read the entity)
   - Set `UserSession.LastUsedAt = DateTimeOffset.UtcNow`
   - Return raw token in `AuthResult.RawRefreshToken`

4. **Implement `AuthService.RefreshAsync(string rawRefreshToken, ...)`**:
   ```
   1. Hash the incoming raw token
   2. Find UserSession by RefreshTokenHash where RevokedAt == null
   3. If NO session found with that hash:
      a. Check if a REVOKED session exists with that hash (RevokedAt != null)
      b. If yes → ATTACK DETECTED: revoke ALL active sessions for that UserId (set RevokedAt = now, Status = Revoked)
      c. Throw UnauthorizedAccessException("Refresh token reuse detected — all sessions revoked")
   4. If session found but RefreshTokenExpiresAt < DateTimeOffset.UtcNow:
      → Revoke the session, throw UnauthorizedAccessException("Refresh token expired")
   5. ROTATE: revoke old session (set RevokedAt = now, Status = Revoked)
   6. Generate new raw token + hash
   7. Create NEW UserSession (same UserId, new hash, new expiry)
   8. Load user + role for JWT generation
   9. Generate new access token via IJwtTokenService
   10. Save changes, return new AuthResult with new tokens
   ```

5. **Implement `AuthService.LogoutAsync(string rawRefreshToken, ...)`**:
   ```
   1. Hash the incoming raw token
   2. Find UserSession by RefreshTokenHash where RevokedAt == null
   3. If not found → return silently (idempotent)
   4. Set RevokedAt = DateTimeOffset.UtcNow, Status = Revoked
   5. Save changes
   ```

6. **Unit tests** in `backend/tests/HorusVis.Business.Tests/`:
   - `RefreshTokenServiceTests.cs`:
     - `GenerateRawToken_ReturnsDifferentTokensEachCall`
     - `HashToken_SameInput_ReturnsSameHash`
     - `HashToken_DifferentInputs_ReturnDifferentHashes`
   - `AuthServiceRefreshTests.cs`:
     - `RefreshAsync_WithValidToken_ReturnsNewTokenPair`
     - `RefreshAsync_WithExpiredToken_ThrowsUnauthorized`
     - `RefreshAsync_WithRevokedToken_RevokesAllSessionsAndThrows`
     - `LogoutAsync_WithValidToken_RevokesSession`
     - `LogoutAsync_WithUnknownToken_DoesNotThrow`
</requirements>

<implementation>
- Use `System.Security.Cryptography.RandomNumberGenerator` and `SHA256` — both are in `System.Security.Cryptography` (BCL, no packages needed)
- When checking for a revoked session in reuse detection: do a SEPARATE query — first look for non-revoked, then look for revoked — do not combine in one query to keep logic clear
- Use `DateTimeOffset.UtcNow` consistently throughout (the entity uses `DateTimeOffset`)
- Do NOT use `DateTime.Now` or `DateTime.UtcNow` — use `DateTimeOffset.UtcNow`
- "Revoke all sessions" means a bulk update: `var sessions = await _db.UserSessions.Where(s => s.UserId == userId && s.RevokedAt == null).ToListAsync(ct); foreach (var s in sessions) { s.RevokedAt = now; s.Status = revokedStatus; }`
</implementation>

<verification>
Before declaring complete:
- [ ] `IRefreshTokenService.cs` exists in `Contracts/`
- [ ] `RefreshTokenService.cs` exists in `Services/` using `RandomNumberGenerator` and `SHA256`
- [ ] `AuthService.LoginAsync` now stores real refresh token hash in `UserSession`
- [ ] `AuthService.RefreshAsync` rotates token (old session revoked, new session created)
- [ ] `AuthService.RefreshAsync` detects replay and revokes ALL user sessions
- [ ] `AuthService.LogoutAsync` is idempotent (no throw for unknown token)
- [ ] `RefreshTokenServiceTests.cs` exists with ≥3 tests
- [ ] `AuthServiceRefreshTests.cs` exists with ≥5 tests covering happy path, expiry, reuse attack, and logout
- [ ] No DateTime (non-offset) usage — only DateTimeOffset
</verification>

<output>
Files to create:
- `backend/src/HorusVis.Business/Contracts/IRefreshTokenService.cs`
- `backend/src/HorusVis.Business/Services/RefreshTokenService.cs`
- `backend/tests/HorusVis.Business.Tests/RefreshTokenServiceTests.cs`
- `backend/tests/HorusVis.Business.Tests/AuthServiceRefreshTests.cs`

Files to modify:
- `backend/src/HorusVis.Business/Services/AuthService.cs` (update LoginAsync + implement RefreshAsync + LogoutAsync)
- `backend/src/HorusVis.Business/ServiceCollectionExtensions.cs` (register IRefreshTokenService)

After all files are written, create `SUMMARY.md`:
```markdown
# Auth Refresh Token Rotation Summary

**IRefreshTokenService implemented with SHA-256 hashing; AuthService.RefreshAsync rotates tokens and detects replay via family invalidation (all sessions revoked on token reuse); LogoutAsync is idempotent; 8 unit tests.**

## Version
v1

## Files Created
- `backend/src/HorusVis.Business/Contracts/IRefreshTokenService.cs`
- `backend/src/HorusVis.Business/Services/RefreshTokenService.cs`
- `backend/tests/HorusVis.Business.Tests/RefreshTokenServiceTests.cs`
- `backend/tests/HorusVis.Business.Tests/AuthServiceRefreshTests.cs`

## Files Modified
- `backend/src/HorusVis.Business/Services/AuthService.cs`
- `backend/src/HorusVis.Business/ServiceCollectionExtensions.cs`

## Decisions Needed
None

## Blockers
Phase 2 (AuthService + UserSession integration) must be complete

## Next Step
Run Phase 4: implement AuthController with httpOnly cookie delivery

---
*Confidence: High*
*Full output: see Files Created above*
```
</output>
