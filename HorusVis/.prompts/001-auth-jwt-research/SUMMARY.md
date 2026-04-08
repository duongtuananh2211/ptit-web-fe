# Auth JWT Research Summary

**Reduce access token from 480 min to 15 min immediately; use built-in PasswordHasher\<User\> (PBKDF2, zero new packages) for hashing; implement refresh token rotation with SHA-256 hash storage and reuse-detection family invalidation in UserSession; store refresh token in httpOnly SameSite=Strict cookie for XSS protection on the React SPA.**

## Version
v1

## Key Findings
- **CRITICAL — Access token lifetime**: Current 480 minutes (8 hours) is 32× the OWASP-recommended 15 minutes. A stolen JWT cannot be revoked and is valid for 8 hours. This is the highest-priority fix.
- **Password hashing**: No hasher implemented yet. Use `PasswordHasher<User>` from `Microsoft.AspNetCore.Identity` (PBKDF2-HMAC-SHA256, 600,000 iterations). Available in `Microsoft.AspNetCore.App` shared framework — zero new NuGet packages required.
- **Refresh token rotation**: `UserSession` entity is perfectly designed — has `RefreshTokenHash`, `RefreshTokenExpiresAt`, `RevokedAt`, `Status`. Store SHA-256 hex hash of raw token; rotate on every use; if a revoked token is replayed → revoke ALL user sessions (token family invalidation / reuse detection).
- **Client token storage**: Store refresh token in httpOnly, Secure, SameSite=Strict cookie (inaccessible to JavaScript → no XSS theft). Store short-lived access token in sessionStorage or in-memory React state. Requires `AllowCredentials()` in CORS policy + `credentials: 'include'` in React fetch calls.
- **HS256 algorithm**: Confirmed appropriate for HorusVis (single service, no multi-party token sharing). No change needed. Signing key must be replaced with a cryptographically random 64+ character value in production (current hardcoded key must not be committed to production config).
- **.NET 10 specifics**: `JwtBearer` v10.0.0 has no breaking API changes. `PasswordHasher<T>` is in the shared framework. `RequireHttpsMetadata = false` in Program.cs must become environment-conditional before production. No new packages needed for any of the planned changes.
- **Claims design**: Embed `sub`, `name`, `email`, `role` name(s), and `jti` (UUID per token) in JWT. Do NOT embed permissions — look them up via DB in authorization handlers to avoid stale permission data. Current `JwtTokenService` already embeds role names correctly.

## Decisions Needed
- **Access token lifetime**: Team must agree on the final value. OWASP recommends 15 minutes; current is 480 minutes. Options: 5 min (high security), 15 min (OWASP standard), 30 min (better UX). Silent background refresh via the `POST /api/auth/refresh` endpoint makes 15 min transparent to users.
- **Refresh token storage strategy**: httpOnly cookie (OWASP-preferred, prevents XSS theft, requires CORS `AllowCredentials()` and `credentials: 'include'` on the React side) vs. sessionStorage for both tokens (simpler implementation, cleared on tab close, weaker against XSS). This choice determines whether CORS changes are needed.
- **Password hashing algorithm**: Built-in `PasswordHasher<User>` (PBKDF2-HMAC-SHA256, 600k iterations — OWASP option 4) vs. adding `BCrypt.Net-Next` (bcrypt work factor 12 — OWASP option 3) vs. adding `Isopoh.Cryptography.Argon2` (Argon2id — OWASP option 1). All three are acceptable; the built-in option requires no new dependencies.
- **Refresh token lifetime**: 7 days (stricter), 14 days (balanced, used in code examples), or 30 days (convenient for infrequent users).

## Blockers
None — UserSession migration is complete (confirmed by `dotnet ef database update` exit code 0). All required data model fields are in place. Implementation can begin immediately.

## Next Step
Create `auth-jwt-plan.md` to design the implementation phases:
1. Phase 1 — Password service (`IPasswordService` wrapping `PasswordHasher<User>`) + `POST /api/auth/register` + `POST /api/auth/login`
2. Phase 2 — Refresh token rotation (`POST /api/auth/refresh` + `POST /api/auth/logout`) using `UserSession`
3. Phase 3 — Reduce token lifetime to 15 minutes + update CORS for cookie strategy
4. Phase 4 — Permissions authorization handlers using Role → RolePermission → Permission

---
*Confidence: High*  
*Iterations: 1*  
*Full output: [auth-jwt-research.md](auth-jwt-research.md)*  
*Sources: OWASP JWT Cheat Sheet (live), OWASP Password Storage Cheat Sheet (live), OWASP Authentication Cheat Sheet (live), Microsoft .NET 10 JWT docs (live), project source code (read directly)*
