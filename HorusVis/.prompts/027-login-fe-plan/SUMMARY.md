# Login FE Plan Summary

**Deliver a secure, production-ready login experience across 5 phases: (1) migrate accessToken to React in-memory state and extend AuthStore context, (2) build HTTP client with automatic 401 refresh-and-retry plus typed auth service, (3) create centered AuthLayout and ProtectedRoute with same-origin returnUrl validation, (4) implement full LoginPage with form validation and role-based redirect, and (5) add session bootstrap with silent token refresh across page reloads.**

## Version
v1

## Key Findings

### Phase 1 — auth-store-upgrade
- Fix critical XSS vulnerability: `accessToken` moves from `localStorage` to React `useState` (in-memory only). Upon page refresh the token becomes `null` and Phase 5 silently restores it via refresh cookie.
- `sessionStorage` persists only non-sensitive metadata (`userId`, `role`, `expiresAt`) so Phase 5 knows to attempt silent refresh rather than showing login immediately.
- AuthStoreContext gains `userId`, `expiresAt`, `isAuthenticated`, `isBootstrapping` fields and a `validateReturnUrl()` helper; `login()` signature extended to accept all four values.
- **Files:** `src/stores/auth-store.tsx`, `src/stores/auth-store-context.ts`

### Phase 2 — http-client-and-api
- `src/lib/httpClient.ts` wraps `fetch` with `Authorization: Bearer` header injection, 401 → silent refresh → retry logic, and a concurrent-guard (one refresh in-flight, other 401s queue until done).
- On refresh failure, `onUnauthorized()` callback clears auth state and navigates to `/login` — injected at initialization time from AppProviders.
- `src/services/authApi.ts` exposes typed `login()`, `logout()`, `getMe()` wrappers; refresh token is sent automatically as httpOnly cookie — no explicit cookie handling in client code.
- **Files:** `src/lib/httpClient.ts` (new), `src/services/authApi.ts` (new)

### Phase 3 — routing-and-layout
- `/login` moves outside `AppShell` to its own route wrapped in `AuthLayout` (centered, no sidebar).
- `ProtectedRoute` checks `isBootstrapping` (→ loading spinner) then `isAuthenticated` (→ `/login?returnUrl=...`); constructs returnUrl using `encodeURIComponent(pathname + search)`; validates with `validateReturnUrl()`.
- All app routes (`/projects`, `/my-tasks`, `/reports`, `/admin`) nested under a `<ProtectedRoute>` outlet inside AppShell; root `/` redirects to `/projects`.
- `RequireAdminRole` redirect target updated from `/` to `/login`.
- **Files:** `src/layouts/AuthLayout.tsx` (new), `src/app/ProtectedRoute.tsx` (new), `src/app/router.tsx`, `src/app/RequireAdminRole.tsx`

### Phase 4 — login-page-and-components
- `LoginForm` is a controlled component with inline validation (required fields, password ≥ 8 chars), loading state during POST, and specific error messages (401 → "Invalid username or password", 5xx → "Server error").
- `LoginPage` orchestrates: reads `?returnUrl`, calls `authStore.login()` after API success, then redirects — validated `returnUrl` if present; else `/admin` for admin role, `/projects` for user role.
- `PasswordField` provides a show/hide toggle without new dependencies.
- **Files:** `src/components/auth/PasswordField.tsx` (new), `src/components/auth/LoginForm.tsx` (new), `src/pages/LoginPage.tsx` (replacement)

### Phase 5 — session-bootstrap
- `isBootstrapping` initialized to `true`; ProtectedRoute shows a loading spinner until bootstrap completes. This prevents the login redirect flicker on page refresh for authenticated users.
- `useSessionBootstrap` hook: if `sessionStorage` has `hv_auth_userId`, fires raw `POST /api/auth/refresh` (browser sends cookie automatically); on success calls `authStore.login()` to restore in-memory token; on failure clears sessionStorage and lets ProtectedRoute redirect to `/login`.
- `AppProviders` updated to mount the bootstrap gate inside `AuthStoreProvider` scope.
- **Files:** `src/hooks/useSessionBootstrap.ts` (new), `src/stores/auth-store.tsx`, `src/stores/auth-store-context.ts`, `src/app/AppProviders.tsx`

---

## Decisions Needed

| # | Question | Default if unconfirmed |
|---|----------|----------------------|
| 1 | Should "remember me" checkbox be added to LoginForm for extended session persistence? | No — httpOnly cookie expiry handles session length; can add later |
| 2 | Should there be a centralized toast/notification for login errors, or inline form error text? | Inline error text in LoginForm; can wire to global toast later |
| 3 | Should ProtectedRoute redirect immediately to `/login`, or briefly show an error page? | Redirect immediately for better UX |
| 4 | Should `RequireAdminRole` redirect include `?returnUrl` to the attempted admin path? | Yes, include returnUrl so admin who re-logs in lands on their intended admin page |
| 5 | Should bootstrap failure (expired refresh cookie) show a brief "session expired" banner on the login page? | No — just show the login page normally; can add later |

---

## Blockers
None. All required backend endpoints are complete and verified (phases 004–007). No new npm dependencies required. All technologies (React Router v6, `fetch`, `sessionStorage`) are standard and available.

---

## Next Step
Run `028-login-fe-auth-store-do` — Execute **Phase 1** (auth-store-upgrade): fix token storage security, extend AuthStore context type, add `validateReturnUrl()`, and add `isBootstrapping` stub. Phase 1 has no dependencies and unblocks all subsequent phases.
