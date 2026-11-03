import { authService } from "./authService";

const API_BASE_URL = "http://localhost:5049";

export interface ReportDashboard {
  totalActiveBugs: number;
  avgTimeToCloseHours: number | null;
  taskVelocityPoints: number;
  criticalPriorityCount: number;
  totalActiveBugsTrend: number | null;
  avgTimeToCloseTrend: number | null;
  taskVelocityTrend: number | null;
  criticalPriorityTrend: number | null;
}

export interface BugDensityItem {
  featureArea: string;
  openCount: number;
  resolvedCount: number;
  avgTimeToCloseHours: number | null;
}

export interface TeamPerformanceItem {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  tasksCompleted: number;
  totalPoints: number;
}

export interface CriticalIssue {
  id: string;
  issueCode: string;
  title: string;
  priority: string;
  severity: string;
  status: string;
  assigneeName: string | null;
  openedAt: string;
  dueDate: string | null;
}

export interface Recommendation {
  ruleKey: string;
  title: string;
  detail: string;
}

export interface ReportsData {
  dashboard: ReportDashboard;
  bugDensity: BugDensityItem[];
  teamPerformance: TeamPerformanceItem[];
  criticalIssues: CriticalIssue[];
  recommendations: Recommendation[];
}

const getAuthHeaders = (): HeadersInit => {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getErrorMessage = async (response: Response, fallback: string) => {
  const error = await response.json().catch(() => ({}));
  return error.value?.detail || error.detail || error.message || fallback;
};

const buildQuery = (values: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });
  return query.toString();
};

const getJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Request failed with status ${response.status}`),
    );
  }

  return response.json();
};

export const reportsService = {
  async getReports(projectId?: string): Promise<ReportsData> {
    const project = projectId ? { projectId } : {};
    const dashboardQuery = buildQuery(project);
    const dailyQuery = buildQuery({ ...project, days: 30 });
    const dashboardSuffix = dashboardQuery ? `?${dashboardQuery}` : "";

    const [dashboard, bugDensity, teamPerformance, criticalIssues, recommendations] =
      await Promise.all([
        getJson<ReportDashboard>(`/api/reports/dashboard${dashboardSuffix}`),
        getJson<BugDensityItem[]>(`/api/reports/bug-density?${dailyQuery}`),
        getJson<TeamPerformanceItem[]>(`/api/reports/team-performance?${dailyQuery}`),
        getJson<CriticalIssue[]>(
          `/api/reports/critical-issues?${buildQuery({ ...project, topN: 10 })}`,
        ),
        getJson<Recommendation[]>(`/api/reports/recommendations${dashboardSuffix}`),
      ]);

    return {
      dashboard,
      bugDensity,
      teamPerformance,
      criticalIssues,
      recommendations,
    };
  },

  async exportCsv(projectId?: string): Promise<{ blob: Blob; fileName: string }> {
    const query = buildQuery({ format: "csv", projectId });
    const response = await fetch(`${API_BASE_URL}/api/reports/export?${query}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, `Export failed with status ${response.status}`),
      );
    }

    const disposition = response.headers.get("content-disposition");
    const filename = disposition?.match(/filename\*?=(?:UTF-8''|")?([^;"]+)/i)?.[1];

    return {
      blob: await response.blob(),
      fileName: filename
        ? decodeURIComponent(filename)
        : `report_${new Date().toISOString().slice(0, 10)}.csv`,
    };
  },
};