import { useQuery } from "@tanstack/react-query";
import { useHorusVisClient } from "../DataProvider/hooks";

function statusStyle(status: string): React.CSSProperties {
  switch (status) {
    case "Success":
      return { background: "green", color: "white" };
    case "Failed":
      return { background: "#c0392b", color: "white" };
    case "InProgress":
      return { background: "#2980b9", color: "white" };
    case "Pending":
    default:
      return { background: "#888", color: "white" };
  }
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function DeploymentStatusPanel() {
  const { deploymentsClient } = useHorusVisClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "deployments"],
    queryFn: () => deploymentsClient.getDeployments(10),
  });

  if (!isLoading && (!data || data.length === 0)) {
    return (
      <div data-empty-state>
        <p>No deployments recorded yet.</p>
      </div>
    );
  }

  if (isLoading) return <p>Loading deployments…</p>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {["Environment", "Version", "Started", "Finished", "Status", "Triggered By"].map(
              (col) => (
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
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {data!.map((d) => (
            <tr key={d.id}>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid #f3f4f6" }}>
                {d.environment}
              </td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid #f3f4f6" }}>
                {d.versionLabel}
              </td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                {formatDate(d.startedAt)}
              </td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                {formatDate(d.finishedAt)}
              </td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid #f3f4f6" }}>
                <span
                  style={{
                    ...statusStyle(d.status),
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: "0.75rem",
                    fontWeight: 500,
                  }}
                >
                  {d.status}
                </span>
              </td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid #f3f4f6" }}>
                {d.triggeredByUserEmail ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
