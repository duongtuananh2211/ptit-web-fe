<plan>
  <summary>
    Deliver a production-ready login feature across 5 phases: (1) secure token storage with AuthStore context extension, (2) HTTP client with automatic 401 refresh-and-retry plus typed AuthApi service, (3) AuthLayout and ProtectedRoute with returnUrl same-origin validation and router restructure, (4) full LoginPage with LoginForm, PasswordField, and client validation plus role-based redirect logic, and (5) session bootstrap with silent refresh that gates protected routes until auth state is initialized. This approach eliminates XSS risk from token storage, ensures seamless token lifecycle management, and provides a frictionless user experience where unauthenticated navigation redirects to login and returns to the intended destination after auth succeeds.
  </summary>

  <phases>
    <phase number="1" name="auth-store-upgrade">
      <objective>Eliminate XSS vulnerability by moving accessToken from localStorage to React in-memory state; extend AuthStoreContext with userId, expiresAt, and isAuthenticated; introduce sessionStorage for non-sensitive metadata bootstrap across page refreshes</objective>
      <tasks>
        <task priority="high">Audit current src/stores/auth-store.tsx: document all localStorage usages (accessToken, user_role); identify where login/logout mutate state</task>
        <task priority="high">Update src/stores/auth-store-context.ts type to include: userId: string | null, expiresAt: string | null (ISO string), isAuthenticated: boolean (computed); update login signature to (token: string, userId: string, role: string, expiresAt: string) and logout signature to () => void; add validateReturnUrl(url: string): boolean helper that checks new URL(url, window.location.origin).origin === window.location.origin</task>
        <task priority="high">Refactor src/stores/auth-store.tsx: remove all localStorage.setItem for accessToken; store token via useState only (in-memory); persist only userId, role, expiresAt to sessionStorage (prefix 'hv_auth_') for page-refresh bootstrap hint; add on-mount restore of those sessionStorage values into state (but NOT the token—token stays null until silent refresh in Phase 5)</task>
        <task priority="medium">Add isAuthenticated computed as accessToken !== null to context value; expose isBootstrapping: boolean initially true (will be used in Phase 5; can set to false immediately until Phase 5 implements bootstrap)</task>
        <task priority="low">Add OWASP justification comment in both files: "Per OWASP XSS Prevention, access tokens must never persist to localStorage. Token lives only in React state; on page refresh it becomes null and is restored via silent refresh (Phase 5). Non-sensitive metadata (userId, role, expiresAt) persists to sessionStorage as a bootstrap hint only."</task>
      </tasks>
      <deliverables>
        <deliverable>src/stores/auth-store.tsx — in-memory token storage only; sessionStorage for userId/role/expiresAt; removed localStorage usage; isBootstrapping flag stubbed to false</deliverable>
        <deliverable>src/stores/auth-store-context.ts — extended type with userId, expiresAt, isAuthenticated, isBootstrapping; updated login/logout signatures; validateReturnUrl helper exported</deliverable>
      </deliverables>
      <dependencies>None—directly modifies existing files</dependencies>
    </phase>

    <phase number="2" name="http-client-and-api">
      <objective>Build a fetch wrapper (httpClient.ts) that automatically handles 401 responses with silent token refresh and request retry; guard against concurrent 401s (one refresh in-flight, queue others); create typed authApi.ts with login, logout, and getMe endpoints</objective>
      <tasks>
        <task priority="high">Create src/lib/httpClient.ts: export makeHttpClient(getAccessToken: () => string | null, onUnauthorized: () => void) that returns request&lt;T&gt;(url: string, options?: RequestInit): Promise&lt;T&gt;; attach Authorization: Bearer header if token exists; on 401 response, attempt silent POST /api/auth/refresh (browser sends refresh_token httpOnly cookie automatically); on refresh success, update token via a setAccessToken callback injected at creation time, then retry the original request; on refresh failure, call onUnauthorized() (which clears auth state and navigates to /login)</task>
        <task priority="high">Implement concurrent 401 guard: keep a module-level isRefreshing flag and a pendingQueue array of { resolve, reject }; if a 401 arrives while isRefreshing is true, push to queue and await; when refresh settles, dequeue and execute all pending requests with new token or reject all on failure</task>
        <task priority="medium">Create src/services/authApi.ts: export login(username: string, password: string): Promise&lt;{ accessToken: string, expiresAt: string, userId: string, role: string }&gt; calling POST /api/auth/login; export logout(): Promise&lt;void&gt; calling POST /api/auth/logout; export getMe(): Promise&lt;{ userId: string, role: string, email: string }&gt; calling GET /api/auth/me; use httpClient internally; add comment explaining refresh token is auto-sent in httpOnly cookie</task>
        <task priority="medium">Wire httpClient into AppProviders or a module-level singleton that receives auth state accessors via callbacks injected from AuthStoreProvider</task>
        <task priority="low">Add dev-only console.debug logging to trace 401 → refresh → retry and concurrent-guard flow</task>
      </tasks>
      <deliverables>
        <deliverable>src/lib/httpClient.ts — fetch wrapper with 401 refresh-and-retry, concurrent guard, Authorization header, generic response type, injected callbacks for token get/set/clear</deliverable>
        <deliverable>src/services/authApi.ts — login, logout, getMe typed wrappers; architecture comment on refresh token auto-send</deliverable>
      </deliverables>
      <dependencies>Phase 1 (updated AuthStoreContext type with login/logout signatures; validateReturnUrl available); httpClient must receive getAccessToken and setAccessToken callbacks—wired in AppProviders or a context-initialized singleton</dependencies>
    </phase>

    <phase number="3" name="routing-and-layout">
      <objective>Create AuthLayout (centered, no sidebar) for login; implement ProtectedRoute with returnUrl redirect and same-origin validation; restructure router.tsx so /login is outside AppShell and all app routes are wrapped in ProtectedRoute; update RequireAdminRole to redirect to /login</objective>
      <tasks>
        <task priority="high">Create src/layouts/AuthLayout.tsx: renders a full-viewport centered flex container with no sidebar or AppShell nav; accepts children; minimal branding (logo/name optional)</task>
        <task priority="high">Create src/app/ProtectedRoute.tsx: read isAuthenticated and isBootstrapping from useAuthStore(); if isBootstrapping, render a loading spinner (centered); if not authenticated, redirect to /login?returnUrl={encodeURIComponent(location.pathname + location.search)}; if authenticated, render &lt;Outlet /&gt;; apply validateReturnUrl defensively (even though ProtectedRoute constructs the URL itself, assert it is same-origin before encoding)</task>
        <task priority="high">Restructure src/app/router.tsx: move /login OUTSIDE AppShell to its own top-level route wrapped with AuthLayout; place all authenticated routes (projects, my-tasks, reports) inside &lt;Route element={&lt;ProtectedRoute /&gt;}&gt; inside AppShell; keep RequireAdminRole nested inside ProtectedRoute for /admin; update root redirect from /login to /projects (ProtectedRoute will redirect to /login if not authenticated)</task>
        <task priority="medium">Update src/app/RequireAdminRole.tsx: change Navigate target from "/" to "/login" (full redirect with returnUrl is optional here since the user is authenticated but wrong role)</task>
        <task priority="low">Add route structure comments explaining public / protected / admin-only layers</task>
      </tasks>
      <deliverables>
        <deliverable>src/layouts/AuthLayout.tsx — centered full-viewport layout with no sidebar</deliverable>
        <deliverable>src/app/ProtectedRoute.tsx — isBootstrapping loading gate, isAuthenticated guard, /login?returnUrl redirect, same-origin returnUrl construction</deliverable>
        <deliverable>src/app/router.tsx — restructured: /login outside AppShell with AuthLayout; protected routes under ProtectedRoute; root redirects to /projects</deliverable>
        <deliverable>src/app/RequireAdminRole.tsx — redirect target updated to /login</deliverable>
      </deliverables>
      <dependencies>Phase 1 (isAuthenticated, isBootstrapping, validateReturnUrl); Phase 5 will set isBootstrapping correctly; Phase 4 will implement the LoginPage behind AuthLayout route</dependencies>
    </phase>

    <phase number="4" name="login-page-and-components">
      <objective>Fully implement the login page with LoginForm, PasswordField, client-side validation, API integration, error handling, and role-based post-login redirect logic with returnUrl support</objective>
      <tasks>
        <task priority="high">Create src/components/auth/PasswordField.tsx: controlled input accepting value, onChange, error, placeholder, disabled props; renders an input[type=password] with a toggle button to switch to text; use show/hide eye icon or text label</task>
        <task priority="high">Create src/components/auth/LoginForm.tsx: controlled form with username text input and PasswordField for password; submit handler validates (username required, password required + min 8 chars) and shows inline field errors; on valid submit, calls authApi.login(username, password), shows loading state (disable button), on 400/401 shows "Invalid username or password", on network/500 shows "Server error, please try again"; on success invokes onSuccess({ accessToken, expiresAt, userId, role }) callback prop</task>
        <task priority="high">Replace src/pages/LoginPage.tsx: read returnUrl from useSearchParams(); validate with validateReturnUrl() from useAuthStore(); mount LoginForm with onSuccess that calls authStore.login(token, userId, role, expiresAt), then navigates: if returnUrl valid → navigate(returnUrl), else if role === 'admin' → navigate('/admin'), else → navigate('/projects'); add console.warn if returnUrl fails validation</task>
        <task priority="medium">Wire AuthSubmitButton or reuse existing button component for LoginForm submit; ensure keyboard submit (Enter key) works</task>
        <task priority="low">Add accessible labels, aria-describedby for error messages in LoginForm and PasswordField</task>
      </tasks>
      <deliverables>
        <deliverable>src/components/auth/PasswordField.tsx — controlled password input with show/hide toggle, error display</deliverable>
        <deliverable>src/components/auth/LoginForm.tsx — controlled form, client validation, authApi.login integration, loading/error states, onSuccess callback</deliverable>
        <deliverable>src/pages/LoginPage.tsx — full replacement with returnUrl parsing, same-origin validation, authStore.login call, role-based redirect</deliverable>
      </deliverables>
      <dependencies>Phase 1 (validateReturnUrl, updated login() signature), Phase 2 (authApi.login), Phase 3 (AuthLayout wrapping LoginPage route in router)</dependencies>
    </phase>

    <phase number="5" name="session-bootstrap">
      <objective>Implement app-level session initialization: on app mount, if no in-memory token but sessionStorage has prior auth hint, attempt silent POST /api/auth/refresh to restore session; gate protected routes behind isBootstrapping loading state until bootstrap completes; handle page refresh seamlessly without flashing login page</objective>
      <tasks>
        <task priority="high">Update src/stores/auth-store.tsx: initialize isBootstrapping to true on mount (instead of false); expose setBootstrapping(value: boolean) in context; update auth-store-context.ts to include isBootstrapping in type</task>
        <task priority="high">Create src/hooks/useSessionBootstrap.ts: useEffect that runs once; if accessToken exists (rare: same-session re-render), set isBootstrapping false immediately; else if sessionStorage has 'hv_auth_userId', attempt POST /api/auth/refresh via fetch (raw fetch, not httpClient, to avoid circular dependency); on success, call authStore.login(newAccessToken, userId, role, expiresAt) and set isBootstrapping false; on failure (401, network), clear sessionStorage hv_auth_* keys, set isBootstrapping false (ProtectedRoute will redirect to /login)</task>
        <task priority="high">Update src/app/AppProviders.tsx: add a SessionBootstrapGate component (or wrap in a component that calls useSessionBootstrap()); this must be rendered inside AuthStoreProvider (to access store) but wraps the router output; alternatively, call useSessionBootstrap() from a top-level layout component that is always mounted</task>
        <task priority="medium">Verify ProtectedRoute already shows loading spinner when isBootstrapping is true (from Phase 3); no additional changes needed if so</task>
        <task priority="medium">Handle edge case: if sessionStorage auth hint exists but refresh returns 401 (e.g., server restart cleared sessions), clear all hv_auth_* sessionStorage keys so subsequent bootstrap skips silently</task>
        <task priority="low">Add end-to-end manual test notes: (1) log in, refresh page → should restore session, (2) log in, logout, refresh page → should show login, (3) navigate to /projects while unauthenticated → should redirect to /login?returnUrl=%2Fprojects, (4) log in from /login?returnUrl=%2Fprojects → should land on /projects</task>
      </tasks>
      <deliverables>
        <deliverable>src/stores/auth-store.tsx — isBootstrapping initialized to true; setBootstrapping method in context</deliverable>
        <deliverable>src/stores/auth-store-context.ts — isBootstrapping and setBootstrapping added to type</deliverable>
        <deliverable>src/hooks/useSessionBootstrap.ts — silent refresh attempt on mount, sessionStorage hint check, isBootstrapping flag management</deliverable>
        <deliverable>src/app/AppProviders.tsx — updated to call useSessionBootstrap (via SessionBootstrapGate or direct hook call inside AuthStoreProvider scope)</deliverable>
      </deliverables>
      <dependencies>Phase 1 (sessionStorage persistence of userId/role/expiresAt; setBootstrapping in context), Phase 2 (httpClient or raw fetch for refresh), Phase 3 (ProtectedRoute isBootstrapping loading spinner), Phase 4 (LoginPage renders correctly after redirect)</dependencies>
    </phase>
  </phases>

  <metadata>
    <confidence level="high">
      Backend auth is complete and tested (JWT endpoints proven in prior phases 004–007). Frontend structure is well-established (React Router v6, context, TanStack Query). All 10 requirements map cleanly to the 5 phases with minimal cross-phase coupling. Token storage security decision follows OWASP guidance precisely. The main implementation risk is the 401 retry concurrency guard (requires careful Promise queue), but the pattern is standard and the single-refresh-in-flight model is simpler than alternatives. Confidence is high that this plan is execution-ready.
    </confidence>
    <dependencies>
      Backend auth endpoints must be stable and accessible (already complete per prior phases). No new npm dependencies required (built-in fetch; React Router v6 already in use). TypeScript types for auth endpoints must match backend: login response shape { accessToken: string, expiresAt: string, userId: string, role: string }. Browser must support sessionStorage (all modern browsers). httpOnly SameSite=Strict refresh_token cookie must be correctly configured on backend (verified in phase 007).
    </dependencies>
    <open_questions>
      1. Should ProtectedRoute redirect to /login immediately or show an error page first? Plan assumes immediate redirect for better UX. 2. Is there a centralized toast/notification system to reuse for login errors, or should LoginForm use inline error state? Plan assumes inline error state. 3. Should "remember me" functionality be added to LoginForm for longer session persistence? Plan assumes no for MVP. 4. Should failed silent refresh during bootstrap (Phase 5) log a warning, or fail fully silently? Plan assumes silent fail with console.debug in dev only.
    </open_questions>
    <assumptions>
      1. Backend /api/auth/refresh accepts the httpOnly cookie automatically sent by the browser (no additional headers needed beyond the cookie). 2. sessionStorage auto-clears on browser close, which is the correct behavior (forces re-login on new browser session). 3. All app URLs are same-origin; same-origin validation of returnUrl is a safe and complete open-redirect guard. 4. React Router v6 useLocation, useNavigate, and useSearchParams are available in all component contexts (no testing framework limitations). 5. The Authorization header format is "Bearer {accessToken}" (standard JWT Bearer scheme). 6. Existing UI components (buttons, inputs) are reusable for LoginForm without new dependencies; if a dedicated component library is not present, plain HTML elements with class-based styling suffice. 7. RequireAdminRole redirect change from "/" to "/login" is non-breaking since all authenticated non-admin users would already be on a valid route before hitting admin.
    </assumptions>
  </metadata>
</plan>
