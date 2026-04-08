import { useState } from "react";
import AdminMetricsBar from "../components/admin/AdminMetricsBar";
import AdminSearchBar from "../components/admin/AdminSearchBar";
import UserDirectoryTable from "../components/admin/UserDirectoryTable";
import AddUserModal from "../components/admin/AddUserModal";
import EditUserDrawer from "../components/admin/EditUserDrawer";
import RolePermissionMatrix from "../components/admin/RolePermissionMatrix";
import SessionMonitoringCard from "../components/admin/SessionMonitoringCard";
import SystemLoadCard from "../components/admin/SystemLoadCard";
import NodeHealthPanel from "../components/admin/NodeHealthPanel";
import DeploymentStatusPanel from "../components/admin/DeploymentStatusPanel";
import type { UserAdminDto } from "../api/clients";

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserAdminDto | null>(null);

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Admin</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <AdminSearchBar value={searchTerm} onChange={setSearchTerm} />
          <button onClick={() => setAddOpen(true)}>Add User</button>
        </div>
      </header>

      <AdminMetricsBar />

      <section data-section="user-directory">
        <h2>User Directory</h2>
        <UserDirectoryTable searchTerm={searchTerm} onEditUser={setEditUser} />
      </section>

      <section data-section="roles">
        <h2>Role Permissions</h2>
        <RolePermissionMatrix />
      </section>

      <section data-section="sessions">
        <h2>Active Sessions</h2>
        <SessionMonitoringCard />
      </section>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        data-section="system"
      >
        <SystemLoadCard />
        <NodeHealthPanel />
      </div>

      <section data-section="deployments">
        <h2>Recent Deployments</h2>
        <DeploymentStatusPanel />
      </section>

      <AddUserModal open={addOpen} onClose={() => setAddOpen(false)} />
      <EditUserDrawer user={editUser} onClose={() => setEditUser(null)} />
    </div>
  );
}

