import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchAdminSessions, revokeSession } from "../../api/adminApi";
import { useAuthStore } from "../../stores/auth-store-context";

function statusStyle(status: string): React.CSSProperties {
  switch (status) {
    case "Active":
      return { background: "green", color: "white" };
    case "Expired":
      return { background: "#f39c12", color: "white" };
    case "Revoked":
    default:
      return { background: "#888", color: "white" };
  }
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function SessionMonitoringCard() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "sessions"],
    queryFn: () => fetchAdminSessions(accessToken!),
    refetchInterval: 30_000,
    enabled: !!accessToken,
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => revokeSession(sessionId, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sessions"] });
      toast.success("Session revoked");
    },
    onError: () => toast.error("Failed to revoke session"),
  });

  if (isLoading) return <p>Loading sessions…</p>;
  if (isError) return <p>Failed to load sessions.</p>;

  const sessions = data ?? [];

  if (sessions.length === 0) return <p>No active sessions.</p>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {[
              "User Email",
              "Created",
              "Last Used",
              "Expires",
              "Status",
              "Action",
            ].map((col) => (
              <th
                key={col}
                style={{
                  padding: "8px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid #e5e7eb",
                  whiteSpace: "nowrap",
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id}>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid #f3f4f6" }}>
                {s.userEmail}
              </td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                {formatDate(s.createdAt)}
              </td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                {formatDate(s.lastUsedAt)}
              </td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                {formatDate(s.refreshTokenExpiresAt)}
              </td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid #f3f4f6" }}>
                <span
                  style={{
                    ...statusStyle(s.displayStatus),
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: "0.75rem",
                    fontWeight: 500,
                  }}
                >
                  {s.displayStatus}
                </span>
              </td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid #f3f4f6" }}>
                {s.displayStatus === "Active" && (
                  <button
                    onClick={() => revokeMutation.mutate(s.id)}
                    disabled={revokeMutation.isPending}
                  >
                    {revokeMutation.isPending ? "Revoking…" : "Revoke"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
