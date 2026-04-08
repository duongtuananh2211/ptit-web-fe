# Auth Config Hardening Summary

**Access token lifetime reduced to 15 min; RequireHttpsMetadata now environment-conditional; CORS AllowCredentials added with specific origin; jti claim added to JWT; ClockSkew set to zero — all auth security hardening complete.**

## Version
v1

## Files Modified
- `backend/src/HorusVis.Web/appsettings.json` — TokenLifetimeMinutes: 480 → 15
- `backend/src/HorusVis.Web/appsettings.Development.json` — TokenLifetimeMinutes: 480 → 15
- `backend/src/HorusVis.Web/Program.cs` — RequireHttpsMetadata env-conditional; CORS AllowCredentials; ClockSkew=Zero
- `backend/src/HorusVis.Web/Services/Authentication/JwtTokenService.cs` — added jti claim

## Decisions Needed
- Confirm frontend origin URL for CORS AllowedOrigin in production (current value: `HorusVis:FrontendOrigin` from config, defaulting to `http://localhost:5173`)
- JWT signing key in appsettings.json is a development placeholder (`HorusVis_Local_Development_Signing_Key_Change_Me_2026`) — must come from environment variable or Key Vault in production

## Blockers
None

## Next Step
Auth implementation complete — run `dotnet test` to verify all tests still pass, then test the endpoints manually

---
*Confidence: High*
*Full output: see Files Modified above*
