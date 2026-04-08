# Auth Refresh Token Rotation Summary

**IRefreshTokenService implemented with SHA-256 hashing; AuthService.RefreshAsync rotates tokens on each use and detects replay via family invalidation (all sessions revoked on token reuse); LogoutAsync is idempotent; 8 unit tests.**

## Version
v1

## Files Created
- `backend/src/HorusVis.Business/Contracts/IRefreshTokenService.cs`
- `backend/src/HorusVis.Business/Services/RefreshTokenService.cs`
- `backend/tests/HorusVis.Business.Tests/RefreshTokenServiceTests.cs`
- `backend/tests/HorusVis.Business.Tests/AuthServiceRefreshTests.cs`

## Files Modified
- `backend/src/HorusVis.Business/Services/AuthService.cs` (LoginAsync + RefreshAsync + LogoutAsync)
- `backend/src/HorusVis.Business/ServiceCollectionExtensions.cs`
- `backend/tests/HorusVis.Business.Tests/AuthServiceTests.cs` (updated constructor calls)

## Decisions Needed
None

## Blockers
None

## Next Step
Run Phase 4: implement AuthController with httpOnly cookie delivery

---
*Confidence: High*
*Full output: see Files Created above*
