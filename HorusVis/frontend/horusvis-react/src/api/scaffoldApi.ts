import { AdminClient, MyTasksClient, ProjectsClient, ReportsClient } from "@horusvis-web/Reference";
import { getApiBaseUrl } from "../lib/env";

export { type ScaffoldApiResponse } from "./types";

export const authApi = {
  getPlaceholder: () => new AdminClient(getApiBaseUrl()).placeholder(),
};

export const projectsApi = {
  getPlaceholder: () => new ProjectsClient(getApiBaseUrl()).placeholder3(),
};

export const myTasksApi = {
  getPlaceholder: () => new MyTasksClient(getApiBaseUrl()).placeholder2(),
};

export const reportsApi = {
  getPlaceholder: () => new ReportsClient(getApiBaseUrl()).placeholder4(),
};

export const adminApi = {
  getPlaceholder: () => new AdminClient(getApiBaseUrl()).placeholder(),
};
