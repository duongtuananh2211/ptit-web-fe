# Auth Controller Summary

**AuthController implemented with POST /api/auth/{login,refresh,logout,register}; refresh token delivered exclusively via httpOnly SameSite=Strict cookie scoped to /api/auth; access token in JSON LoginResponse; error responses use ProblemDetails.**

## Version
v1

## Files Created
- `backend/src/HorusVis.Web/Contracts/LoginRequest.cs`
- `backend/src/HorusVis.Web/Contracts/RegisterRequest.cs`
- `backend/src/HorusVis.Web/Contracts/LoginResponse.cs`

## Files Replaced
- `backend/src/HorusVis.Web/Controllers/AuthController.cs` — scaffold replaced with real implementation using IAuthService; removed IJwtTokenService dependency, scaffold /login, /me, /placeholder endpoints; added /login, /refresh, /logout, /register

## Files Modified
- `backend/src/HorusVis.Web/Program.cs` — no changes required; IAuthService already registered via AddHorusVisBusiness(); ITokenGenerator already registered explicitly

## Decisions Made
- `LoginResponse.ExpiresAt` maps to `AuthResult.AccessTokenExpiresAt` (access token expiry only; refresh token never appears in JSON body)
- Cookie Path = "/api/auth" scopes refresh_token cookie to auth endpoints only
- Secure = true set unconditionally; Phase 5 will make this env-conditional
- All four endpoints are anonymous (no [Authorize] attribute) — they are the auth boundary itself

## Blockers
None

## Next Step
Run Phase 5: reduce token lifetime to 15 min, env-conditional HTTPS, CORS AllowCredentials

---
*Confidence: High*
*Full output: see Files Created/Replaced above*
