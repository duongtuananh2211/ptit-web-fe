import { createContext } from "react";
import type {
  TypedAdminUsersClient,
  TypedAdminRolesClient,
  TypedAdminSessionsClient,
  TypedAdminMetricsClient,
  TypedDeploymentsClient,
} from "../../api/clients";
import type { AuthClient, MyTasksClient, ProjectsClient, ReportsClient } from "@horusvis-web/Reference";

export type HorusVisClientContextType = {
  adminUsersClient: TypedAdminUsersClient;
  adminRolesClient: TypedAdminRolesClient;
  adminSessionsClient: TypedAdminSessionsClient;
  adminMetricsClient: TypedAdminMetricsClient;
  deploymentsClient: TypedDeploymentsClient;
  authClient: AuthClient;
  myTasksClient: MyTasksClient;
  projectsClient: ProjectsClient;
  reportsClient: ReportsClient;
};

export const HorusVisClientContext = createContext(null as unknown as HorusVisClientContextType);
