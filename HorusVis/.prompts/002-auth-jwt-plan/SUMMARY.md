# Auth JWT Plan Summary

**5-phase plan: password service → login/register auth service → refresh token rotation → auth controller with httpOnly cookies → config hardening; zero new NuGet packages, all within existing project structure.**

## Version
v1

## Key Findings
- **Phase 1: password-service** — `IPasswordService` + `PasswordService` using `PasswordHasher<User>` (PBKDF2-HMAC-SHA256, 600k iterations, built into `Microsoft.AspNetCore.App` shared framework)
- **Phase 2: auth-service-login-register** — `IAuthService` with `LoginAsync` and `RegisterAsync`; generic error messages to prevent username enumeration; returns `AuthResult` record
- **Phase 3: refresh-token-rotation** — `IRefreshTokenService` (random 64-byte token, SHA-256 hash for storage) + rotation on every use + family invalidation on replay via `UserSession`; EF Core transaction prevents race conditions on concurrent refresh
- **Phase 4: auth-controller** — `POST /api/auth/{login,refresh,logout,register}`; refresh token delivered exclusively via `httpOnly Secure SameSite=Strict` cookie scoped to `/api/auth`; access token in JSON `LoginResponse` body only
- **Phase 5: config-hardening** — 15-min access tokens (down from 480 min), `RequireHttpsMetadata = !IsDevelopment()`, CORS `AllowCredentials()` with specific origin, `jti` claim on every access token, `ClockSkew = TimeSpan.Zero`

## Decisions Made
| Topic | Decision | Rationale |
|---|---|---|
| Access token lifetime | **15 minutes** | OWASP standard; stolen token usable max 15 min with no revocation |
| Refresh token storage (client) | **httpOnly Secure SameSite=Strict cookie** | OWASP-preferred for SPAs; XSS cannot read httpOnly cookies |
| Refresh token storage (server) | **SHA-256 hex hash in UserSession.RefreshTokenHash** | Database breach cannot expose usable tokens |
| Password algorithm | **PasswordHasher\<User\>** (PBKDF2-HMAC-SHA256, 600k iterations) | Zero new NuGet packages; OWASP option 4; FIPS-compliant |
| Refresh token lifetime | **14 days** | Balanced UX/security; enforced server-side via RefreshTokenExpiresAt |
| Signing algorithm | **HS256 — no change** | Single-service API; symmetric key appropriate; no microservices |

## Decisions Needed
- What **default role** should newly registered users receive? The plan requires a `Role` record with `RoleCode = "user"` in the database. If this seed data does not exist, `RegisterAsync` will throw. A seed migration may be required before Phase 2 can be tested.
- **Concurrent sessions**: allow unlimited sessions per user (one per device/browser) or cap at N and evict the oldest? Current plan: unlimited.
- **IJwtTokenService location**: move from `HorusVis.Web` to `HorusVis.Business` (preferred — token generation is a domain concern) or keep in Web and wire via DI? This affects Phase 2 AuthService constructor.

## Blockers
None — `UserSession` migration is confirmed applied (exit code 0), all entities are in place, and the existing `JwtTokenService` and `JwtAuthenticationOptions` are correct starting points.

## Files Created (8 new)
| File | Phase |
|---|---|
| `backend/src/HorusVis.Business/Contracts/IPasswordService.cs` | 1 |
| `backend/src/HorusVis.Business/Services/PasswordService.cs` | 1 |
| `backend/src/HorusVis.Business/Contracts/IAuthService.cs` | 2 |
| `backend/src/HorusVis.Business/Contracts/AuthResult.cs` | 2 |
| `backend/src/HorusVis.Business/Services/AuthService.cs` | 2 |
| `backend/src/HorusVis.Business/Contracts/IRefreshTokenService.cs` | 3 |
| `backend/src/HorusVis.Business/Services/RefreshTokenService.cs` | 3 |
| `backend/src/HorusVis.Web/Controllers/AuthController.cs` | 4 |
| `backend/src/HorusVis.Web/Contracts/Auth/LoginRequest.cs` | 4 |
| `backend/src/HorusVis.Web/Contracts/Auth/RegisterRequest.cs` | 4 |
| `backend/src/HorusVis.Web/Contracts/Auth/LoginResponse.cs` | 4 |

## Files Modified (6 existing)
| File | Phase | Change |
|---|---|---|
| `backend/src/HorusVis.Business/ServiceCollectionExtensions.cs` | 1, 2, 3 | Register IPasswordHasher, IPasswordService, IAuthService, IRefreshTokenService |
| `backend/src/HorusVis.Web/Program.cs` | 4, 5 | Register IAuthService; fix RequireHttpsMetadata; CORS AllowCredentials |
| `backend/src/HorusVis.Web/appsettings.json` | 5 | TokenLifetimeMinutes: 480 → 15; add AllowedOrigins |
| `backend/src/HorusVis.Web/Options/JwtAuthenticationOptions.cs` | 5 | Default lifetime: 480 → 15 |
| `backend/src/HorusVis.Web/Services/Authentication/JwtTokenService.cs` | 5 | Add jti claim |

## Security Coverage After Phase 5
- Password hashing: PBKDF2-HMAC-SHA256, 600k iterations
- Refresh token: stored as SHA-256 hash, delivered via httpOnly cookie, rotated on every use
- Replay detection: revoked token reuse revokes all user sessions (family invalidation)
- Access token: 15-min lifetime, jti claim, ClockSkew=Zero
- HTTPS: enforced in production
- CORS: AllowCredentials with specific origin (not wildcard)
- Error messages: generic (no username enumeration)

## Out of Scope (Future Iterations)
- Production signing key → Azure Key Vault / environment variable
- Rate limiting on `/api/auth/login` and `/api/auth/refresh`
- Account lockout after N failed attempts
- Session cap per user (max N concurrent sessions)

## Next Step
Execute Phase 1: implement `IPasswordService` + `PasswordService` in `HorusVis.Business`.

---
*Confidence: High*
*Iterations: 1*
*Full output: [auth-jwt-plan.md](auth-jwt-plan.md)*
*Based on: 001-auth-jwt-research*
