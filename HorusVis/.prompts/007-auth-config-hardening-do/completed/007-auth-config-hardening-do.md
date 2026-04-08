# Prompt: Auth Configuration Hardening — Phase 5 of 5

## Metadata
- **Purpose**: Do
- **Topic**: auth-config-hardening
- **Phase**: 5 of 5 (auth implementation)
- **References**: `.prompts/002-auth-jwt-plan/auth-jwt-plan.md`, `.prompts/001-auth-jwt-research/auth-jwt-research.md`
- **Depends on**: Phase 4 (AuthController must exist — CORS AllowCredentials impacts it)
- **SUMMARY**: `.prompts/007-auth-config-hardening-do/SUMMARY.md`

---

<objective>
Apply security hardening to the JWT and CORS configuration: reduce access token lifetime from 480 minutes to 15 minutes, make HTTPS enforcement environment-conditional, add `AllowCredentials()` to CORS for cookie support, add `jti` claim to JWT, and set `ClockSkew` to zero.

**These are all configuration/code changes — no new files are created, only existing files modified.**
</objective>

<context>
Plan: @.prompts/002-auth-jwt-plan/auth-jwt-plan.md (Phase 5 details)
Research: @.prompts/001-auth-jwt-research/auth-jwt-research.md (access token lifetime, HTTPS, CORS, jti)

Relevant project files to read before implementing (read ALL of these first):
- `backend/src/HorusVis.Web/Program.cs` — see current JWT config, CORS policy, middleware order
- `backend/src/HorusVis.Web/appsettings.json` — see current token lifetime value
- `backend/src/HorusVis.Web/appsettings.Development.json` — may need updates
- `backend/src/HorusVis.Web/Options/JwtAuthenticationOptions.cs` — current options class
- `backend/src/HorusVis.Web/Services/Authentication/JwtTokenService.cs` — how token claims are built
</context>

<requirements>
1. **Access token lifetime — `appsettings.json`**:
   - Find the token lifetime setting (it may be `JwtAuthentication:TokenLifetimeMinutes` or similar)
   - Change value from `480` to `15`
   - If the same setting exists in `appsettings.Development.json`, update it there too

2. **RequireHttpsMetadata — `Program.cs`**:
   - Locate the current `options.RequireHttpsMetadata = false` (or wherever it's set)
   - Change to: `options.RequireHttpsMetadata = !app.Environment.IsDevelopment();`
   - Note: this must reference `app` (the `WebApplication`), not `builder`. If it's in `builder.Services.AddAuthentication(...)` before `app` is built, you need a different approach — read the current Program.cs structure and use the appropriate environment check (e.g., `builder.Environment.IsDevelopment()`)

3. **CORS AllowCredentials — `Program.cs`**:
   - Locate the existing CORS policy configuration
   - Add `.AllowCredentials()` to the policy
   - **IMPORTANT**: `AllowCredentials()` requires a specific origin — it is **incompatible with `AllowAnyOrigin()`** or wildcard `*`. If the current policy uses `AllowAnyOrigin()`, replace it with `.WithOrigins("http://localhost:5173")` (or the configured frontend URL — read the existing config to find it; it may be in `appsettings.json` as `CorsSettings:AllowedOrigin` or similar)
   - If the allowed origin is in config, keep reading it from config — don't hardcode it

4. **Add `jti` claim — `JwtTokenService.cs`**:
   - Find where claims are constructed (the `List<Claim>` or `ClaimsIdentity`)
   - Add: `new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())`
   - This requires `using Microsoft.IdentityModel.JsonWebTokens;` or `using System.IdentityModel.Tokens.Jwt;` — check what's already imported

5. **ClockSkew = Zero — `Program.cs`**:
   - Find `TokenValidationParameters` in the JWT bearer setup
   - Add or update: `ClockSkew = TimeSpan.Zero`
   - This means tokens expire AT the specified time with no grace period — the 15-minute lifetime is exact

6. **Verify no secrets exposed**:
   - Check that the JWT signing key in `appsettings.json` is a placeholder/development value only
   - If `appsettings.json` contains a real secret like a production key, add a comment noting it must come from environment variables or Key Vault in production
   - Do NOT change the key value — just flag it if it looks like a real production secret
</requirements>

<implementation>
- Read the actual file contents carefully before making changes — the current structure may differ from assumptions
- For `RequireHttpsMetadata`: use `builder.Environment.IsDevelopment()` if the change is inside `builder.Services.Add...()` calls (before `var app = builder.Build()`), or `app.Environment.IsDevelopment()` if it's after
- For CORS: check if the existing `WithOrigins(...)` call reads from config — if so, preserve that pattern; just add `.AllowCredentials()`
- Do NOT change the JWT signing algorithm (HS256) — confirmed appropriate for single-service API
- Do NOT change any other security settings not listed above
</implementation>

<verification>
Before declaring complete:
- [ ] `appsettings.json` has token lifetime set to `15` (not `480`)
- [ ] `Program.cs` RequireHttpsMetadata is now environment-conditional (not hardcoded `false`)
- [ ] CORS policy has `.AllowCredentials()` AND uses `.WithOrigins(...)` (not `AllowAnyOrigin`)
- [ ] `JwtTokenService.cs` adds `Jti` claim using `Guid.NewGuid().ToString()`
- [ ] `TokenValidationParameters` has `ClockSkew = TimeSpan.Zero` (or confirms it's already set)
- [ ] No new files created (all changes are modifications)
- [ ] Build still compiles after changes
</verification>

<output>
Files to modify only (no new files):
- `backend/src/HorusVis.Web/appsettings.json`
- `backend/src/HorusVis.Web/appsettings.Development.json` (if token lifetime exists there)
- `backend/src/HorusVis.Web/Program.cs`
- `backend/src/HorusVis.Web/Services/Authentication/JwtTokenService.cs`

After all changes are applied, create `SUMMARY.md`:
```markdown
# Auth Config Hardening Summary

**Access token lifetime reduced to 15 min (from 480); RequireHttpsMetadata now env-conditional; CORS AllowCredentials added with specific origin; jti claim added to JWT; ClockSkew set to zero — all auth security hardening complete.**

## Version
v1

## Files Modified
- `backend/src/HorusVis.Web/appsettings.json` — TokenLifetimeMinutes: 480 → 15
- `backend/src/HorusVis.Web/Program.cs` — RequireHttpsMetadata env-conditional; CORS AllowCredentials; ClockSkew=Zero
- `backend/src/HorusVis.Web/Services/Authentication/JwtTokenService.cs` — added jti claim
- [list any other files changed]

## Decisions Needed
- Confirm frontend origin URL for CORS AllowedOrigin in production (currently development default used)
- Confirm JWT signing key rotation plan for production (key in appsettings.json is development-only)

## Blockers
None

## Next Step
Auth implementation complete — run all tests, then review implementation before deploying

---
*Confidence: High*
*Full output: see Files Modified above*
```
</output>
