import { useQuery } from "@tanstack/react-query";
import { fetchAdminMetrics } from "../../api/adminApi";
import { useAuthStore } from "../../stores/auth-store-context";

export default function AdminMetricsBar() {
  const { accessToken } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: () => fetchAdminMetrics(accessToken!),
    enabled: !!accessToken,
  });

  const cards = [
    {
      label: "Total Users",
      value: isError ? "--" : (data?.totalUsers ?? "--"),
    },
    {
      label: "Active Sessions",
      value: isError ? "--" : (data?.activeSessions ?? "--"),
    },
    {
      label: "Avg CPU Load",
      value: isError
        ? "--"
        : data
          ? `${data.avgCpuLoadPercent.toFixed(1)}%`
          : "--",
    },
  ];

  return (
    <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            flex: 1,
            padding: "1rem",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            background: "#fff",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
            {card.label}
          </div>
          {isLoading ? (
            <div
              style={{
                marginTop: "0.5rem",
                height: "1.5rem",
                borderRadius: "0.25rem",
                background: "#e5e7eb",
              }}
            />
          ) : (
            <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>
              {card.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
