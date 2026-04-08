<objective>
Implement Admin Phase 6: build the four remaining admin panels — RolePermissionMatrix,
SessionMonitoringCard, SystemLoadCard + NodeHealthPanel, and DeploymentStatusPanel —
then assemble the fully wired AdminPage with all sections in final layout order.

Purpose: Completes the entire Admin feature (Task 05). After this phase the admin page
is fully functional end-to-end.
Output: 5 new components + finalized AdminPage; npm build passes with 0 TS errors.
</objective>

<context>
Implementation plan (phase 6 detail):
@.prompts/012-admin-plan/admin-plan.md

Phase 4 (API layer, auth store, adminApi.ts) MUST be complete.
Phase 5 (UserDirectoryTable, AddUserModal, EditUserDrawer) MUST be complete.

Current state of AdminPage after Phase 5:
@frontend/horusvis-react/src/pages/AdminPage.tsx

API functions used in this phase:
@frontend/horusvis-react/src/api/adminApi.ts

Auth hook:
@frontend/horusvis-react/src/stores/auth-store.tsx

Task specification:
@docs/outlines/tasks/05-admin/README.md

Reference UI:
@docs/outlines/stitch_horusvis/saas_user_management/screen.png
</context>

<requirements>
1. ROLEPERMISSIONMATRIX
   Create frontend/horusvis-react/src/components/admin/RolePermissionMatrix.tsx.

   Data:
     const rolesQuery = useQuery({ queryKey: ['admin', 'roles'], queryFn: () => fetchAdminRoles(token), enabled: !!token });
     
     Derive the full permission set from union of all roles' permissions:
       const allPermissions = useMemo(() => {
         if (!rolesQuery.data) return [];
         const seen = new Set<string>();
         const result: PermissionScopeDto[] = [];
         for (const role of rolesQuery.data) {
           for (const p of role.permissions) {
             if (!seen.has(p.scope)) { seen.add(p.scope); result.push(p); }
           }
         }
         return result.sort((a, b) => a.scope.localeCompare(b.scope));
       }, [rolesQuery.data]);

     Local state per role: track pending selection changes before save.
       type RoleEdits = Record<string, Set<string>>;  // roleId → selected scope set
       const [edits, setEdits] = useState<RoleEdits>({});
       
       // Initialize from server data when loaded
       useEffect(() => {
         if (!rolesQuery.data) return;
         setEdits(Object.fromEntries(
           rolesQuery.data.map(r => [r.id, new Set(r.permissions.map(p => p.scope))])
         ));
       }, [rolesQuery.data]);

   Grid layout:
     <table>
       <thead>
         <tr>
           <th>Permission</th>
           {roles.map(r => (
             <th key={r.id}>
               {r.roleName}
               {r.isSystem && <span title="System roles cannot be modified"> 🔒</span>}
             </th>
           ))}
         </tr>
       </thead>
       <tbody>
         {allPermissions.map(p => (
           <tr key={p.scope}>
             <td>{p.scope}</td>
             {roles.map(r => (
               <td key={r.id}>
                 <input
                   type="checkbox"
                   checked={edits[r.id]?.has(p.scope) ?? false}
                   disabled={r.isSystem}
                   onChange={(e) => {
                     setEdits(prev => {
                       const next = new Set(prev[r.id]);
                       e.target.checked ? next.add(p.scope) : next.delete(p.scope);
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

   Save button per non-system role column (render below each column header or as a row):
     For each role where isSystem === false:
       <button onClick={() => handleSave(role.id)} disabled={saveMutation.isPending}>
         {saveMutation.isPending ? 'Saving…' : 'Save'}
       </button>

   Save mutation:
     const saveMutation = useMutation({
       mutationFn: ({ roleId, scopes }: { roleId: string; scopes: string[] }) =>
         updateRolePermissions(roleId, scopes, token!),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
         toast.success('Permissions saved');
       },
       onError: () => toast.error('Failed to save permissions'),
     });

   NOTE: If no roles have any permissions in the DB (dev environment),
   the table body will be empty. Render <p>No permissions defined yet.</p> in that case.

2. SESSIONMONITORINGCARD
   Create frontend/horusvis-react/src/components/admin/SessionMonitoringCard.tsx.

   Data:
     useQuery({
       queryKey: ['admin', 'sessions'],
       queryFn: () => fetchAdminSessions(token!),
       refetchInterval: 30_000,
       enabled: !!token,
     })

   Table columns: User Email | Created | Last Used | Expires | Status | Action

   Status badge (span):
     'Active'  → background: green, color: white
     'Expired' → background: #f39c12 (orange), color: white
     'Revoked' → background: #888, color: white

   Revoke button:
     Only render when session.displayStatus === 'Active'.
     const revokeMutation = useMutation({
       mutationFn: (sessionId: string) => revokeSession(sessionId, token!),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
         toast.success('Session revoked');
       },
       onError: () => toast.error('Failed to revoke session'),
     });
     <button
       onClick={() => revokeMutation.mutate(session.id)}
       disabled={revokeMutation.isPending}
     >
       {revokeMutation.isPending ? 'Revoking…' : 'Revoke'}
     </button>

   Date formatting: toLocaleString() for all date fields; "—" if null.

   isLoading: <p>Loading sessions…</p>
   isError: <p>Failed to load sessions.</p>
   Empty: if sessions.length === 0 render <p>No active sessions.</p>

3. SYSTEMLOADCARD
   Create frontend/horusvis-react/src/components/admin/SystemLoadCard.tsx.

   Data: share the metrics query (same key as AdminMetricsBar — TanStack Query deduplicates).
     useQuery({
       queryKey: ['admin', 'metrics'],
       queryFn: () => fetchAdminMetrics(token!),
       enabled: !!token,
     })

   Renders:
     <div>
       <h3>System Load</h3>
       <label>CPU Load</label>
       <progress value={data?.avgCpuLoadPercent ?? 0} max={100} />
       <span>{data ? `${data.avgCpuLoadPercent.toFixed(1)}%` : '--'}</span>

       <label>Memory Load</label>
       <progress value={data?.avgMemoryLoadPercent ?? 0} max={100} />
       <span>{data ? `${data.avgMemoryLoadPercent.toFixed(1)}%` : '--'}</span>
     </div>
   isLoading: render progress bars at 0%

4. NODEHEALTHPANEL
   Create frontend/horusvis-react/src/components/admin/NodeHealthPanel.tsx.

   Data:
     useQuery({ queryKey: ['admin', 'nodes'], queryFn: () => fetchAdminNodes(token!), enabled: !!token })

   Table columns: Node Name | Environment | CPU% | Memory% | Status | Last Heartbeat

   Status badge:
     'Online'   → green
     'Degraded' → #f39c12 orange
     'Offline'  → #c0392b red
     other      → #888

   Empty: if nodes.length === 0 render <p>No nodes registered.</p>

5. DEPLOYMENTSTATUSPANEL
   Create frontend/horusvis-react/src/components/admin/DeploymentStatusPanel.tsx.

   Data:
     useQuery({ queryKey: ['admin', 'deployments'], queryFn: () => fetchDeployments(10, token!), enabled: !!token })

   Empty state (REQUIRED — Deployments table is empty in dev environment):
     if (!isLoading && (!data || data.length === 0)):
       <div data-empty-state>
         <p>No deployments recorded yet.</p>
       </div>

   Otherwise: table — Environment | Version | Started | Finished | Status | Triggered By

   Status badge:
     'Success'    → green
     'Failed'     → #c0392b red
     'InProgress' → #2980b9 blue
     'Pending'    → #888 grey

6. ASSEMBLE FINAL ADMINPAGE
   Fully replace frontend/horusvis-react/src/pages/AdminPage.tsx with the final assembled layout.
   Keep all Phase 5 state (addOpen, editUser) and add no new state.

   Final layout order:
     <div className="admin-page">
       <header className="admin-page__header">
         <h1>Admin</h1>
         <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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

       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            data-section="system">
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
</requirements>

<implementation>
- Import all API functions from ../api/adminApi.ts
- Import useAuthStore from ../stores/auth-store
- All useQuery/useMutation/useQueryClient from @tanstack/react-query
- All toast from sonner
- Do NOT install any new packages
- RolePermissionMatrix: if rolesQuery.data is empty or undefined, render <p>Loading roles…</p>
- saveMutation: one per component, not one per role — call mutate({ roleId, scopes: [...edits[roleId]] })
  For each non-system role's "Save" button, call handleSave(role.id) which triggers the single mutation
- TanStack Query v5 queryClient.invalidateQueries expects object form: { queryKey: [...] }
- Session dates: use toLocaleString() for all dates displayed in SessionMonitoringCard
</implementation>

<output>
Create/modify these files:

frontend/horusvis-react/src/:
- `components/admin/RolePermissionMatrix.tsx` — NEW: checkbox grid, isSystem lock, save per role
- `components/admin/SessionMonitoringCard.tsx` — NEW: session table, status badges, revoke action
- `components/admin/SystemLoadCard.tsx` — NEW: CPU/memory progress bars
- `components/admin/NodeHealthPanel.tsx` — NEW: per-node status table
- `components/admin/DeploymentStatusPanel.tsx` — NEW: deployment table + empty state
- `pages/AdminPage.tsx` — final assembled layout with all 7 sections
</output>

<verification>
Before declaring complete:
1. Run: cd frontend/horusvis-react && npm run build
   → Must exit 0 with zero TypeScript errors
2. Confirm RolePermissionMatrix: isSystem columns have disabled checkboxes
3. Confirm DeploymentStatusPanel: renders empty state element (data-empty-state) when data is empty
4. Confirm SessionMonitoringCard: refetchInterval: 30_000 in useQuery options
5. Confirm SystemLoadCard uses queryKey: ['admin', 'metrics'] (same key as AdminMetricsBar)
6. Confirm AdminPage has all 7 sections in correct order
7. Confirm AdminPage still has AddUserModal + EditUserDrawer from Phase 5
</verification>

<summary_requirements>
Create `.prompts/015-admin-panels-do/SUMMARY.md`

Template:
# Admin Panels — SUMMARY
**{one-liner}**

## Version
v1

## Key Findings
- {panels built}
- {empty state handling}
- {auto-refresh on sessions}

## Files Created
- list all created/modified files

## Decisions Needed
{Deployments and SystemNodes tables likely empty in dev — seed data needed for visual testing?}

## Blockers
{build errors if any, or None}

## Next Step
Task 05 Admin is complete. Next: Task 02 Projects (009-projects-plan.md) or seed SystemNodes/Deployments tables for visual testing.
</summary_requirements>

<success_criteria>
- RolePermissionMatrix: checkbox grid from union of all permission scopes; isSystem disables column
- SessionMonitoringCard: 30s auto-refresh, revoke button (Active sessions only), status badges
- SystemLoadCard: reuses ['admin', 'metrics'] query key (deduplication, no extra network call)
- NodeHealthPanel: per-node table, empty state for no nodes
- DeploymentStatusPanel: empty state rendered when Deployments table is empty
- AdminPage: final layout with all 7 sections in correct order; Phase 5 Add/Edit still wired
- `npm run build` passes with 0 TS errors
- SUMMARY.md at .prompts/015-admin-panels-do/SUMMARY.md
</success_criteria>
