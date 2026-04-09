# 028 — Login FE Auth Store Upgrade (Do)

## Objective

Implement Phase 1 of the HorusVis login feature: upgrade `AuthStoreContext` and `AuthStoreProvider` to fix the XSS vulnerability (move `accessToken` from localStorage to in-memory React state), extend the context type with `userId`, `expiresAt`, `isAuthenticated`, and `isBootstrapping`, and update `localStorage` usage to preserve only non-sensitive bootstrap metadata (`userId`, `role`, `expiresAt`) for page-refresh resilience.

**User preference:** Use `localStorage` (NOT `sessionStorage`) for the non-sensitive bootstrap metadata. The `accessToken` must never touch any persistent storage — it lives only in React state.

---

## Context

**Plan:**
@.prompts/027-login-fe-plan/login-fe-plan.md (Phase 1: auth-store-upgrade)

**Files to modify:**
- `frontend/horusvis-react/src/stores/auth-store-context.ts`
- `frontend/horusvis-react/src/stores/auth-store.tsx`

**Current auth-store-context.ts:**
```ts
import { createContext, useContext } from "react";

export type AuthStoreContext = {
  accessToken: string | null;
  userRole: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
};

export const AuthStoreContext = createContext<AuthStoreContext | null>(null);

export function useAuthStore() {
  const store = useContext(AuthStoreContext);
  if (store === null) {
    throw new Error("useAuthStore must be used within AuthStoreProvider.");
  }
  return store;
}
```

**Current auth-store.tsx:**
```tsx
import { type PropsWithChildren, useState } from "react";
import { AuthStoreContext } from "./auth-store-context";

export function AuthStoreProvider({ children }: PropsWithChildren) {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("access_token"),
  );
  const [userRole, setUserRole] = useState<string | null>(
    localStorage.getItem("user_role"),
  );

  function login(token: string, role: string) {
    setAccessToken(token);
    setUserRole(role);
    localStorage.setItem("access_token", token);
    localStorage.setItem("user_role", role);
  }

  function logout() {
    setAccessToken(null);
    setUserRole(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
  }

  return (
    <AuthStoreContext.Provider value={{ accessToken, userRole, login, logout }}>
      {children}
    </AuthStoreContext.Provider>
  );
}
```

**Known consumers that use `useAuthStore()` (must not break):**
- `src/app/RequireAdminRole.tsx` — reads `userRole`
- `src/pages/ProjectDetailPage.tsx` — reads `accessToken`
- `src/hooks/useProjects.ts` — reads `accessToken` (many hooks)
- `src/components/DataProvider/AuthenticationProvider.tsx` — reads `accessToken`, `logout`

---

## Requirements

### 1. `auth-store-context.ts` — Extend the type

Update `AuthStoreContext` type to:

```ts
export type AuthStoreContext = {
  // In-memory token only — never persisted to any storage
  accessToken: string | null;

  // Non-sensitive metadata — persisted to localStorage for bootstrap
  userId: string | null;
  userRole: string | null;
  expiresAt: string | null; // ISO 8601 string

  // Derived / status flags
  isAuthenticated: boolean; // true iff accessToken !== null
  isBootstrapping: boolean; // true while silent refresh is in-flight on mount

  // Actions
  login: (token: string, userId: string, role: string, expiresAt: string) => void;
  logout: () => void;
  setAccessToken: (token: string | null) => void; // for httpClient to update on silent refresh
  setIsBootstrapping: (value: boolean) => void;   // for useSessionBootstrap hook

  // Utility
  validateReturnUrl: (url: string) => boolean;
};
```

Keep `useAuthStore()` export unchanged (same name, same error message).

Also export `validateReturnUrl` as a standalone named export (not just on the type) so it can be imported in modules that don't need the full store:

```ts
export function validateReturnUrl(url: string): boolean {
  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}
```

### 2. `auth-store.tsx` — Implement the upgraded provider

Key implementation rules:

- `accessToken` state is initialized to `null` (NEVER read from localStorage)
- `userId`, `userRole`, `expiresAt` state is initialized from `localStorage` using keys `hv_auth_userId`, `hv_auth_role`, `hv_auth_expiresAt`
- `isBootstrapping` state is initialized to `true` (Phase 5's `useSessionBootstrap` will flip it to false; Phase 3's `ProtectedRoute` will show a spinner until then)
- `isAuthenticated` is computed as `accessToken !== null`

**`login(token, userId, role, expiresAt)` function:**
- Sets all four state values
- Saves `userId`, `role`, `expiresAt` to localStorage (`hv_auth_userId`, `hv_auth_role`, `hv_auth_expiresAt`)
- Does NOT save `token` to localStorage

**`logout()` function:**
- Clears all state (set to `null`)
- Removes `hv_auth_userId`, `hv_auth_role`, `hv_auth_expiresAt` from localStorage
- Does NOT touch `access_token` in localStorage (it was never there)

**`setAccessToken(token)` function:**
- Updates only `accessToken` state
- Used by httpClient to store new token after silent refresh

**`setIsBootstrapping(value)` function:**
- Updates `isBootstrapping` state

**Context `value` object:**
Must include: `accessToken`, `userId`, `userRole`, `expiresAt`, `isAuthenticated`, `isBootstrapping`, `login`, `logout`, `setAccessToken`, `setIsBootstrapping`, `validateReturnUrl`

### 3. Migration: clean up old localStorage keys

In `logout()`: also remove the old keys `access_token` and `user_role` from localStorage (one-time migration cleanup, harmless if they don't exist):
```ts
localStorage.removeItem("access_token");
localStorage.removeItem("user_role");
```

On mount (useEffect with empty deps), also clean up old keys silently:
```ts
useEffect(() => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_role");
}, []);
```

### 4. Backward compatibility

All existing consumers read `accessToken`, `userRole`, and/or `logout` from `useAuthStore()`. These three fields must remain on the context type with the same names and types. No consumer needs to be modified as part of this phase — the new fields are additive.

---

## Output

Modify the two files in place:
- `frontend/horusvis-react/src/stores/auth-store-context.ts`
- `frontend/horusvis-react/src/stores/auth-store.tsx`

Do NOT create any new files in this phase.

After modifying files, create `.prompts/028-login-fe-auth-store-do/SUMMARY.md` with:

```markdown
# Auth Store Upgrade Summary

**{one-liner}**

## Version
v1

## Files Modified
- `frontend/horusvis-react/src/stores/auth-store-context.ts`
- `frontend/horusvis-react/src/stores/auth-store.tsx`

## Key Changes
{bullet list of what changed}

## Decisions Made
- localStorage used for userId/role/expiresAt metadata (user preference; not sessionStorage)
- accessToken lives in-memory only (React useState, never persisted)
- isBootstrapping initialized to true (Phase 5 useSessionBootstrap will set to false)

## Decisions Needed
{any open questions}

## Blockers
{None, or describe}

## Next Step
Run `029-login-fe-http-client-do` — Phase 2: build httpClient.ts with 401 refresh-and-retry and authApi.ts typed service
```

---

## Success Criteria

- `auth-store-context.ts` has the full updated type with all new fields and `validateReturnUrl` standalone export
- `auth-store.tsx` initializes `accessToken` to `null` (no localStorage read for token)
- `auth-store.tsx` stores `userId`, `role`, `expiresAt` to `localStorage` with `hv_auth_` prefix
- `auth-store.tsx` implements `setAccessToken` and `setIsBootstrapping` methods
- Old localStorage keys (`access_token`, `user_role`) are cleaned up on mount and logout
- All existing consumers (`useAuthStore()` with `accessToken`, `userRole`, `logout`) remain working without changes
- `SUMMARY.md` created
