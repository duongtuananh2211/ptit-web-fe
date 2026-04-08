import { type PropsWithChildren, useMemo } from "react";
import { AuthClient, MyTasksClient, ProjectsClient, ReportsClient } from "@horusvis-web/Reference";
import {
  TypedAdminUsersClient,
  TypedAdminRolesClient,
  TypedAdminSessionsClient,
  TypedAdminMetricsClient,
  TypedDeploymentsClient,
} from "../../api/clients";
import { getApiBaseUrl } from "../../lib/env";
import { useAuthentication } from "./hooks";
import { HorusVisClientContext } from "./HorusVisClientContext";

export function HorusVisClientProvider({ children }: PropsWithChildren) {
  const authenticator = useAuthentication();

  const clients = useMemo(
    () => ({
      adminUsersClient: new TypedAdminUsersClient(getApiBaseUrl(), authenticator),
      adminRolesClient: new TypedAdminRolesClient(getApiBaseUrl(), authenticator),
      adminSessionsClient: new TypedAdminSessionsClient(getApiBaseUrl(), authenticator),
      adminMetricsClient: new TypedAdminMetricsClient(getApiBaseUrl(), authenticator),
      deploymentsClient: new TypedDeploymentsClient(getApiBaseUrl(), authenticator),
      authClient: new AuthClient(getApiBaseUrl(), authenticator),
      myTasksClient: new MyTasksClient(getApiBaseUrl(), authenticator),
      projectsClient: new ProjectsClient(getApiBaseUrl(), authenticator),
      reportsClient: new ReportsClient(getApiBaseUrl(), authenticator),
    }),
    [authenticator],
  );

  return <HorusVisClientContext.Provider value={clients}>{children}</HorusVisClientContext.Provider>;
}
