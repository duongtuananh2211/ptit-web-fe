# Auth Login/Register Summary

**IAuthService + AuthService implemented with LoginAsync (username/email lookup, password verify, JWT issue) and RegisterAsync (duplicate check, password hash, user create); RefreshAsync/LogoutAsync stubbed for Phase 3; 5 unit tests; UserSession created on login.**

## Version
v1

## Files Created
- `backend/src/HorusVis.Business/Contracts/AuthResult.cs`
- `backend/src/HorusVis.Business/Contracts/IAuthService.cs`
- `backend/src/HorusVis.Business/Contracts/ITokenGenerator.cs`
- `backend/src/HorusVis.Business/Services/AuthService.cs`
- `backend/tests/HorusVis.Business.Tests/AuthServiceTests.cs`

## Files Modified
- `backend/src/HorusVis.Business/ServiceCollectionExtensions.cs` — added `IAuthService → AuthService` scoped registration
- `backend/src/HorusVis.Web/Services/Authentication/JwtTokenService.cs` — added `ITokenGenerator` implementation (`GenerateToken` delegates to `CreateToken`)
- `backend/src/HorusVis.Web/Program.cs` — registered `ITokenGenerator` forwarding to `IJwtTokenService`
- `backend/tests/HorusVis.Business.Tests/HorusVis.Business.Tests.csproj` — added `Microsoft.EntityFrameworkCore.InMemory` package and `HorusVis.Data` project reference

## Key Design Decisions

### ITokenGenerator (not IJwtTokenService)
`HorusVis.Business` does not reference `HorusVis.Web` (would create circular dependency). A minimal `ITokenGenerator` interface was placed in `HorusVis.Business/Contracts/`. `JwtTokenService` implements both `IJwtTokenService` and `ITokenGenerator`. DI wire-up in `Program.cs` forwards the scoped `IJwtTokenService` to `ITokenGenerator`.

### HorusVisDbContext — no explicit DbSets
The context uses `FindAllModelsConvention`, so all entity access uses `db.Set<T>()` rather than named properties.

### Tests — manual fakes
No mocking framework is in `Directory.Packages.props`. `FakePasswordService` and `FakeTokenGenerator` are hand-rolled test doubles inside `AuthServiceTests.cs`. Each test creates a fresh InMemory database (`Guid.NewGuid()` name).

### UserSession on login — PLACEHOLDER
`RefreshTokenHash = "PLACEHOLDER"` is intentional. Phase 3 will implement `IRefreshTokenService` with proper token hashing and family invalidation. The `RawRefreshToken` returned in `AuthResult` is a throw-away `Guid.NewGuid().ToString()`.

## Decisions Needed
- Confirm default role `RoleCode` for new registrations (assumed `"user"`, case-insensitive match). This value **must exist** in the `Roles` table — add it to seed data / migration if not already present.

## Blockers
None (Phase 1 `IPasswordService` is implemented and verified).

## Next Step
Run Phase 3: implement `IRefreshTokenService` with secure token generation (CSPRNG → SHA-256 hash stored in DB), refresh token rotation, family invalidation on reuse, and `LogoutAsync`.

---
*Confidence: High*
*Tests: 5/5 passing*
