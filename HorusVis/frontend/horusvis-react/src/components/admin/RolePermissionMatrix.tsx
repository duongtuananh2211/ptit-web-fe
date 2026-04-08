import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useHorusVisClient } from "../DataProvider/hooks";
import type { PermissionScopeDto } from "../../api/clients";

type RoleEdits = Record<string, Set<string>>; // roleId → selected scope set

export default function RolePermissionMatrix() {
  const { adminRolesClient } = useHorusVisClient();
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => adminRolesClient.getRoles(),
  });

  const allPermissions = useMemo(() => {
    if (!rolesQuery.data) return [];
    const seen = new Set<string>();
    const result: PermissionScopeDto[] = [];
    for (const role of rolesQuery.data) {
      for (const p of role.permissions) {
        if (!seen.has(p.scope)) {
          seen.add(p.scope);
          result.push(p);
        }
      }
    }
    return result.sort((a, b) => a.scope.localeCompare(b.scope));
  }, [rolesQuery.data]);

  const [edits, setEdits] = useState<RoleEdits>({});

  useEffect(() => {
    if (!rolesQuery.data) return;
    setEdits(
      Object.fromEntries(
        rolesQuery.data.map((r) => [
          r.id,
          new Set(r.permissions.map((p) => p.scope)),
        ]),
      ),
    );
  }, [rolesQuery.data]);

  const saveMutation = useMutation({
    mutationFn: ({
      roleId,
      scopes,
    }: {
      roleId: string;
      scopes: string[];
    }) => adminRolesClient.updateRolePermissions(roleId, scopes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      toast.success("Permissions saved");
    },
    onError: () => toast.error("Failed to save permissions"),
  });

  function handleSave(roleId: string) {
    const scopes = edits[roleId] ? [...edits[roleId]] : [];
    saveMutation.mutate({ roleId, scopes });
  }

  if (rolesQuery.isLoading) return <p>Loading roles…</p>;
  if (rolesQuery.isError) return <p>Failed to load roles.</p>;

  const roles = rolesQuery.data ?? [];

  if (allPermissions.length === 0) {
    return <p>No permissions defined yet.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th
              style={{
                padding: "8px 12px",
                textAlign: "left",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              Permission
            </th>
            {roles.map((r) => (
              <th
                key={r.id}
                style={{
                  padding: "8px 12px",
                  textAlign: "center",
                  borderBottom: "1px solid #e5e7eb",
                  minWidth: 120,
                }}
              >
                <div>{r.roleName}</div>
                {r.isSystem && (
                  <span title="System roles cannot be modified"> 🔒</span>
                )}
                {!r.isSystem && (
                  <div style={{ marginTop: 4 }}>
                    <button
                      onClick={() => handleSave(r.id)}
                      disabled={saveMutation.isPending}
                      style={{ fontSize: "0.75rem" }}
                    >
                      {saveMutation.isPending ? "Saving…" : "Save"}
                    </button>
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allPermissions.map((p) => (
            <tr key={p.scope}>
              <td
                style={{
                  padding: "6px 12px",
                  borderBottom: "1px solid #f3f4f6",
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                }}
              >
                {p.scope}
              </td>
              {roles.map((r) => (
                <td
                  key={r.id}
                  style={{
                    padding: "6px 12px",
                    borderBottom: "1px solid #f3f4f6",
                    textAlign: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={edits[r.id]?.has(p.scope) ?? false}
                    disabled={r.isSystem}
                    onChange={(e) => {
                      setEdits((prev) => {
                        const next = new Set(prev[r.id]);
                        e.target.checked
                          ? next.add(p.scope)
                          : next.delete(p.scope);
                        return { ...prev, [r.id]: next };
                      });
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
