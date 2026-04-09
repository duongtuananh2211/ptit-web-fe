# Auth Store Upgrade Summary

**AuthStoreContext extended with userId/expiresAt/isAuthenticated/isBootstrapping and setAccessToken/setIsBootstrapping/validateReturnUrl; accessToken moved to in-memory-only React state (XSS fix); userId/role/expiresAt persisted to localStorage with hv_auth_ prefix; old unscoped keys cleaned up on mount.**

## Version
v1

## Files Modified
- `frontend/horusvis-react/src/stores/auth-store-context.ts`
- `frontend/horusvis-react/src/stores/auth-store.tsx`

## Key Changes

### auth-store-context.ts
- Added `userId: string | null`, `expiresAt: string | null`, `isAuthenticated: boolean`, `isBootstrapping: boolean` to context type
- Added `setAccessToken(token)` and `setIsBootstrapping(value)` action types (used by httpClient and useSessionBootstrap)
- Added `validateReturnUrl: (url: string) => boolean` to context type
- Updated `login()` signature to `(token, userId, role, expiresAt)`
- Exported `validateReturnUrl` as a standalone function (same-origin check via `new URL()`)

### auth-store.tsx
- `accessToken` state initialized to `null` — never reads from any storage (XSS fix)
- `userId`, `userRole`, `expiresAt` initialized from `localStorage` keys `hv_auth_userId`, `hv_auth_role`, `hv_auth_expiresAt`
- `isBootstrapping` initialized to `true` (Phase 5 will set to `false` after bootstrap)
- `isAuthenticated` derived as `accessToken !== null`
- `login()` saves only metadata (userId/role/expiresAt) to localStorage — never the token
- `logout()` clears all state and localStorage keys; also removes legacy `access_token`/`user_role` keys
- `setAccessToken()` exposes token updater for httpClient silent-refresh flow
- `setIsBootstrapping()` exposes flag for `useSessionBootstrap` hook
- `useEffect` on mount cleans up old `access_token` and `user_role` localStorage keys

## Decisions Made
- **localStorage** used for `userId`/`role`/`expiresAt` metadata (user preference; not sessionStorage)
- `accessToken` lives in-memory only (React `useState`, initialized to `null`)
- `isBootstrapping` starts `true`; Phase 5 `useSessionBootstrap` will flip it to `false`
- Legacy key cleanup is silent and harmless if keys don't exist

## Decisions Needed
None — all backward-compatible; existing consumers of `accessToken`, `userRole`, and `logout` still work without modification.

## Blockers
None

## Next Step
Run `029-login-fe-http-client-do` — Phase 2: build `src/lib/httpClient.ts` with 401 refresh-and-retry + concurrent guard, and `src/services/authApi.ts` typed service wrappers.
