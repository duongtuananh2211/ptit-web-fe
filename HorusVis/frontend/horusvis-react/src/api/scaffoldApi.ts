import { apiGet } from "./httpClient";
import type { ScaffoldApiResponse } from "./types";

function createScaffoldApi(endpoint: string) {
  return {
    getPlaceholder() {
      return apiGet<ScaffoldApiResponse>(endpoint);
    },
  };
}

export const authApi = createScaffoldApi("/api/auth/placeholder");
export const projectsApi = createScaffoldApi("/api/projects/placeholder");
export const myTasksApi = createScaffoldApi("/api/my-tasks/placeholder");
export const reportsApi = createScaffoldApi("/api/reports/placeholder");
export const adminApi = createScaffoldApi("/api/admin/placeholder");
