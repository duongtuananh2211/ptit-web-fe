import { useQuery } from "@tanstack/react-query";
import { fetchAdminNodes } from "../../api/adminApi";
import { useAuthStore } from "../../stores/auth-store-context";

function statusStyle(status: string): React.CSSProperties {
  switch (status) {
    case "Online":
      return { background: "green", color: "white" };
    case "Degraded":
      return { background: "#f39c12", color: "white" };
    case "Offline":
      return { background: "#c0392b", color: "white" };
    default:
      return { background: "#888", color: "white" };
  }
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function NodeHealthPanel() {
  const { accessToken } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "nodes"],
    queryFn: () => fetchAdminNodes(accessToken!),
    enabled: !!accessToken,
  });

  if (isLoading) return <p>Loading nodes…</p>;
  if (isError) return <p>Failed to load nodes.</p>;

  const nodes = data ?? [];

  if (nodes.length === 0) {
    return (
      <div
        style={{
          padding: "1rem",
          borderRadius: "0.5rem",
          border: "1px solid #e5e7eb",
          background: "#fff",
        }}
      >
        <h3 style={{ margin: "0 0 0.75rem" }}>Node Health</h3>
        <p>No nodes registered.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "0.5rem",
        border: "1px solid #e5e7eb",
        background: "#fff",
      }}
    >
      <h3 style={{ margin: "0 0 0.75rem" }}>Node Health</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {["Node Name", "Environment", "CPU%", "Memory%", "Status", "Last Heartbeat"].map(
                (col) => (
                  <th
                    key={col}
                    style={{
                      padding: "6px 10px",
                      textAlign: "left",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                      fontSize: "0.85rem",
                    }}
                  >
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {nodes.map((n) => (
              <tr key={n.id}>
                <td style={{ padding: "5px 10px", borderBottom: "1px solid #f3f4f6" }}>
                  {n.nodeName}
                </td>
                <td style={{ padding: "5px 10px", borderBottom: "1px solid #f3f4f6" }}>
                  {n.environment}
                </td>
                <td style={{ padding: "5px 10px", borderBottom: "1px solid #f3f4f6" }}>
                  {n.cpuLoadPercent != null ? `${n.cpuLoadPercent.toFixed(1)}%` : "—"}
                </td>
                <td style={{ padding: "5px 10px", borderBottom: "1px solid #f3f4f6" }}>
                  {n.memoryLoadPercent != null ? `${n.memoryLoadPercent.toFixed(1)}%` : "—"}
                </td>
                <td style={{ padding: "5px 10px", borderBottom: "1px solid #f3f4f6" }}>
                  <span
                    style={{
                      ...statusStyle(n.status),
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  >
                    {n.status}
                  </span>
                </td>
                <td style={{ padding: "5px 10px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                  {formatDate(n.lastHeartbeatAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
