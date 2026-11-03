import { authService } from "./authService";

const API_BASE_URL = "http://localhost:5049";

interface RawSprint {
  id?: string;
  Id?: string;
  sprintCode?: string;
  SprintCode?: string;
  startDate?: string;
  StartDate?: string;
  endDate?: string;
  EndDate?: string;
  goal?: string | null;
  Goal?: string | null;
  isCurrent?: boolean;
  IsCurrent?: boolean;
}

export interface Sprint {
  id: string;
  sprintCode: string;
  startDate: string;
  endDate: string;
  goal: string | null;
  isCurrent: boolean;
}

const getAuthHeaders = (): HeadersInit => {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getErrorMessage = async (response: Response): Promise<string> => {
  const error = await response.json().catch(() => ({}));
  return (
    error.value?.detail ||
    error.detail ||
    error.message ||
    `Failed to load sprints with status ${response.status}`
  );
};

const normalizeSprint = (raw: RawSprint): Sprint => ({
  id: raw.id ?? raw.Id ?? "",
  sprintCode: raw.sprintCode ?? raw.SprintCode ?? "",
  startDate: raw.startDate ?? raw.StartDate ?? "",
  endDate: raw.endDate ?? raw.EndDate ?? "",
  goal: raw.goal ?? raw.Goal ?? null,
  isCurrent: raw.isCurrent ?? raw.IsCurrent ?? false,
});

export const sprintsService = {
  async listSprints(): Promise<Sprint[]> {
    const response = await fetch(`${API_BASE_URL}/api/sprints`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("The sprint list response was not an array.");
    }

    return (payload as RawSprint[]).map(normalizeSprint);
  },
};
