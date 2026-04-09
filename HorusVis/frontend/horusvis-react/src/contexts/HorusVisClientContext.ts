import { createContext, useContext } from 'react';
import type {
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

export type HorusVisClientContextType = {
  adminClient: AdminClient;
  adminMetricsClient: AdminMetricsClient;
  adminRolesClient: AdminRolesClient;
  adminSessionsClient: AdminSessionsClient;
  adminUsersClient: AdminUsersClient;
  authClient: AuthClient;
  deploymentsClient: DeploymentsClient;
  myTasksClient: MyTasksClient;
  projectsClient: ProjectsClient;
  reportsClient: ReportsClient;
  sprintsClient: SprintsClient;
};

export const HorusVisClientContext = createContext<HorusVisClientContextType>(
  null as unknown as HorusVisClientContextType,
);

export function useHorusVisClient(): HorusVisClientContextType {
  return useContext(HorusVisClientContext);
}
