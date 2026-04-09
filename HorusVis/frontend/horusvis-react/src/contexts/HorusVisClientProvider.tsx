import { type PropsWithChildren, useMemo, useRef, useEffect } from 'react';
import {
  AdminClient,
  AdminMetricsClient,
  AdminRolesClient,
  AdminSessionsClient,
  AdminUsersClient,
  AuthClient,
  DeploymentsClient,
  MyTasksClient,
  ProjectsClient,
  ReportsClient,
  SprintsClient,
} from '@horusvis-web/Reference';
import { Authenticator } from '../lib/authenticator';
import { HorusVisClientContext } from './HorusVisClientContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Provides all NSwag-generated Swagger clients to the React tree.
 * Each client receives an `Authenticator` instance that automatically
 * injects the `Authorization: Bearer <token>` header into every request,
 * reading the current token from localStorage on each call.
 *
 * Place this provider high in the component tree (e.g. inside App) so
 * that any component can call `useHorusVisClient()` to obtain a client.
 */
export function HorusVisClientProvider({ children }: PropsWithChildren) {
  /**
   * The authenticator holds a reference to the logout handler via a ref so
   * it does not need to be recreated when the logout function changes.
   */
  const logoutRef = useRef<() => void>(() => {
    localStorage.removeItem('authToken');
    window.location.reload();
  });

  const authenticator = useMemo(() => {
    const auth = new Authenticator();
    auth.addEventListener('tokenExpired', () => logoutRef.current());
    auth.addEventListener('authError', () => logoutRef.current());
    return auth;
  }, []);

  // Keep logoutRef current if a consumer swaps it out later (not needed here
  // but follows the same pattern as the old DataProvider for forward-compat).
  useEffect(() => {
    // no-op: logoutRef.current is already set to the default above.
  }, []);

  const clients = useMemo(
    () => ({
      adminClient: new AdminClient(API_BASE_URL, authenticator),
      adminMetricsClient: new AdminMetricsClient(API_BASE_URL, authenticator),
      adminRolesClient: new AdminRolesClient(API_BASE_URL, authenticator),
      adminSessionsClient: new AdminSessionsClient(API_BASE_URL, authenticator),
      adminUsersClient: new AdminUsersClient(API_BASE_URL, authenticator),
      authClient: new AuthClient(API_BASE_URL, authenticator),
      deploymentsClient: new DeploymentsClient(API_BASE_URL, authenticator),
      myTasksClient: new MyTasksClient(API_BASE_URL, authenticator),
      projectsClient: new ProjectsClient(API_BASE_URL, authenticator),
      reportsClient: new ReportsClient(API_BASE_URL, authenticator),
      sprintsClient: new SprintsClient(API_BASE_URL, authenticator),
    }),
    [authenticator],
  );

  return (
    <HorusVisClientContext.Provider value={clients}>
      {children}
    </HorusVisClientContext.Provider>
  );
}
