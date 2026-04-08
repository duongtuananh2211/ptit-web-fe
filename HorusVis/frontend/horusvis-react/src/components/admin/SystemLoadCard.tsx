import { useQuery } from "@tanstack/react-query";
import { fetchAdminMetrics } from "../../api/adminApi";
import { useAuthStore } from "../../stores/auth-store-context";

export default function SystemLoadCard() {
  const { accessToken } = useAuthStore();

  const { data } = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: () => fetchAdminMetrics(accessToken!),
    enabled: !!accessToken,
  });

  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "0.5rem",
        border: "1px solid #e5e7eb",
        background: "#fff",
      }}
    >
      <h3 style={{ margin: "0 0 1rem" }}>System Load</h3>

      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 4 }}>
          CPU Load
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <progress
            value={data?.avgCpuLoadPercent ?? 0}
            max={100}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: "0.85rem", minWidth: 40, textAlign: "right" }}>
            {data ? `${data.avgCpuLoadPercent.toFixed(1)}%` : "--"}
          </span>
        </div>
      </div>

      <div>
        <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 4 }}>
          Memory Load
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <progress
            value={data?.avgMemoryLoadPercent ?? 0}
            max={100}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: "0.85rem", minWidth: 40, textAlign: "right" }}>
            {data ? `${data.avgMemoryLoadPercent.toFixed(1)}%` : "--"}
          </span>
        </div>
      </div>
    </div>
  );
}
