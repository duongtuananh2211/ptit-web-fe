# 027 — Login Feature Frontend Plan

## Objective

Create a phased implementation plan for the **HorusVis frontend login feature**.

Purpose: Deliver a production-ready login flow — `LoginPage`, `AuthLayout`, `ProtectedRoute` with `returnUrl`, silent token refresh, and logout — so that every unauthenticated navigation attempt redirects to `/login?returnUrl={path}` and returns the user to their intended destination after successful login.

Input: Existing auth research, completed backend auth work, and current frontend scaffold state (see Context below).
Output: `login-fe-plan.md` with phases, tasks, deliverables, and metadata.

---

## Context

**Auth research (JWT strategy, OWASP guidance):**
@.prompts/001-auth-jwt-research/auth-jwt-research.md

**Backend already done — key facts:**
- `POST /api/auth/login` → `{ accessToken, expiresAt, role, userId }` (JSON body)
- `POST /api/auth/refresh` → reads `refresh_token` httpOnly cookie, rotates it, returns new `accessToken`
- `POST /api/auth/logout` → revokes refresh_token cookie
- `GET /api/auth/me` → returns current user info
- Refresh token delivered as httpOnly `SameSite=Strict` cookie scoped to `/api/auth`
- Access token is short-lived (15 min), returned in JSON body only

**Frontend current state:**
- `src/app/router.tsx` — `/login` route exists inside `AppShell`; no protected routes yet
- `src/app/AppShell.tsx` — sidebar layout; login should NOT use this layout
- `src/app/RequireAdminRole.tsx` — admin-only guard pattern (reference for `ProtectedRoute`)
- `src/app/AppProviders.tsx` — `QueryClientProvider` > `AuthStoreProvider` > `ProjectsStoreProvider` > etc.
- `src/stores/auth-store.tsx` — stores `accessToken` + `userRole` in **localStorage** (security issue: access token must move to in-memory)
- `src/stores/auth-store-context.ts` — `AuthStoreContext` type: `{ accessToken, userRole, login, logout }`
- `src/pages/LoginPage.tsx` — placeholder only (`FeaturePage` wrapper)
- `src/lib/env.ts` — `getApiBaseUrl()` helper
- No `src/lib/httpClient.ts` exists yet
- No `src/services/authApi.ts` exists yet
- Uses React Router v6 (`createBrowserRouter`), TanStack Query, React context for state

**Task spec:** `docs/outlines/tasks/01-login/README.md`

**Additional requirements from user:**
- All routes that require authentication must redirect unauthenticated users to `/login?returnUrl={encoded-path}`
- After successful login, redirect to `returnUrl` (if present and same-origin) or to the default post-login route
- `returnUrl` must be validated (same-origin only) to prevent open-redirect attacks

---

## Planning Requirements

The plan must address:

1. **Auth token storage strategy** — Move `accessToken` from `localStorage` to in-memory (React state only). `userId`, `role`, `expiresAt` may optionally persist to `sessionStorage` for page-refresh bootstrap. Justify the choice against OWASP XSS guidance.

2. **HTTP client** (`src/lib/httpClient.ts`) — A fetch/axios wrapper that:
   - Attaches `Authorization: Bearer <accessToken>` to every request
   - On 401 response: calls `POST /api/auth/refresh` once, stores new access token, retries the original request
   - On refresh failure: clears auth state and calls `navigate('/login?returnUrl={location}')` (or equivalent)
   - Handles concurrent 401s (queue requests while refresh is in-flight, don't call refresh N times)

3. **authApi service** (`src/services/authApi.ts`) — Typed wrappers for login, logout, me endpoints using the HTTP client

4. **AuthStore upgrade** — Extend context type to expose `userId`, `expiresAt`; fix localStorage → in-memory for `accessToken`; add `isAuthenticated` derived bool

5. **ProtectedRoute component** (`src/app/ProtectedRoute.tsx`) — Reads auth state, redirects to `/login?returnUrl={encodeURIComponent(location.pathname + location.search)}` if not authenticated; renders `<Outlet />` if authenticated

6. **AuthLayout** (`src/layouts/AuthLayout.tsx`) — Centered, minimal layout (no sidebar) for login page; login route must move outside `AppShell`

7. **LoginPage + LoginForm** — Full replacement of the placeholder:
   - `pages/LoginPage.tsx` — page wrapper that reads `?returnUrl`, calls `authApi.login`, stores token, redirects
   - `components/auth/LoginForm.tsx` — controlled form with `username` + `password` fields, submit handling, error display
   - `components/auth/PasswordField.tsx` — input with show/hide toggle
   - Client-side validation: empty fields, password min-length

8. **Router restructure** — Move `/login` outside `AppShell` (uses `AuthLayout`); wrap all app routes inside a `ProtectedRoute` outlet; update `RequireAdminRole` redirect to use `navigate('/login')` instead of `navigate('/')`

9. **Session bootstrap** — On app load (or page refresh), if no in-memory `accessToken` exists, attempt silent refresh (`POST /api/auth/refresh`); show loading state while bootstrapping; fall through to login if refresh fails

10. **Role-based post-login redirect** — After successful login with no `returnUrl`: redirect to `/projects` if role = user; redirect to `/admin` if role = admin (per task spec)

Constraints:
- Must not introduce new dependencies unless strictly necessary; prefer built-in `fetch` over axios
- `returnUrl` must be same-origin validated before use (prevent open redirect)
- No breaking changes to existing `RequireAdminRole` behavior (but it may be updated to redirect to `/login` instead of `/`)
- Plan phases should be independently executable in sequence

---

## Output Structure

Save to: `.prompts/027-login-fe-plan/login-fe-plan.md`

Structure the plan using this XML format:

```xml
<plan>
  <summary>
    {One paragraph overview of the approach}
  </summary>

  <phases>
    <phase number="1" name="{phase-name}">
      <objective>{What this phase accomplishes}</objective>
      <tasks>
        <task priority="high">{Specific actionable task}</task>
        <task priority="medium">{Another task}</task>
      </tasks>
      <deliverables>
        <deliverable>{What's produced}</deliverable>
      </deliverables>
      <dependencies>{What must exist before this phase}</dependencies>
    </phase>
  </phases>

  <metadata>
    <confidence level="{high|medium|low}">
      {Why this confidence level}
    </confidence>
    <dependencies>
      {External dependencies needed}
    </dependencies>
    <open_questions>
      {Uncertainties that may affect execution}
    </open_questions>
    <assumptions>
      {What was assumed in creating this plan}
    </assumptions>
  </metadata>
</plan>
```

---

## Summary Requirements

After creating `login-fe-plan.md`, create `.prompts/027-login-fe-plan/SUMMARY.md` with:

- **One-liner** — A substantive description of what the plan delivers (not generic)
- **Version** — v1
- **Key Findings** — Phase breakdown with objectives and key design decisions
- **Decisions Needed** — Any choices requiring user input before execution
- **Blockers** — External impediments
- **Next Step** — The first Do prompt to run

Format:
```markdown
# Login FE Plan Summary

**{One-liner}**

## Version
v1

## Key Findings
{Phase-by-phase summary with design decisions}

## Decisions Needed
{Table or list of open choices}

## Blockers
{None, or describe}

## Next Step
{Concrete action — name the first Do prompt}
```

---

## Success Criteria

- Plan covers all 10 requirements above
- Each phase is independently executable and has clear deliverables
- `returnUrl` safety (same-origin validation) is explicitly addressed in the relevant phase
- Access token storage security decision is justified in metadata/assumptions
- `login-fe-plan.md` and `SUMMARY.md` both created with correct structure
- Metadata includes confidence, dependencies, open_questions, assumptions
