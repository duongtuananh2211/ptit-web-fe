import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  adminUsersService,
  type AdminUserDto,
} from "../services/adminUsersService";
import ActionToast from "../components/ActionToast";

const PAGE_SIZE = 20;

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrator" },
  { value: "user", label: "User" },
];

const formatDate = (value: string | null): string => {
  if (!value) {
    return "Never";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString();
};

const getRoleLabel = (user: AdminUserDto): string => {
  const matched = ROLE_OPTIONS.find(
    (option) => option.value === user.roleCode.toLowerCase(),
  );
  if (matched) {
    return matched.label;
  }

  return user.roleName || user.roleCode;
};

interface AdminLocationState {
  toast?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as AdminLocationState | null;
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const loadUsers = async (reset: boolean) => {
    if (reset) {
      setLoading(true);
      setError("");
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await adminUsersService.listUsers({
        cursor: reset ? undefined : (nextCursor ?? undefined),
        pageSize: PAGE_SIZE,
      });

      setUsers((prev) => (reset ? response.data : [...prev, ...response.data]));
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadUsers(true);
  }, []);

  useEffect(() => {
    const message = locationState?.toast?.trim();
    if (!message) {
      return;
    }

    setToastMessage(message);
    setShowToast(true);

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, locationState?.toast, navigate]);

  return (
    <div className="space-y-8">
      <ActionToast
        visible={showToast}
        message={toastMessage}
        onClose={() => setShowToast(false)}
      />
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-on-surface editorial-tight">
            User Administration
          </h2>
          <p className="text-on-surface-variant mt-1">
            Manage users by API: list, create, and update records.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              navigate("/admin/users/new");
              setError("");
            }}
            className="px-5 py-2 primary-gradient text-on-primary rounded-xl font-bold shadow-lg hover:scale-102 active:scale-98 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">
              person_add
            </span>
            Add User
          </button>
          <button
            type="button"
            onClick={() => {
              void loadUsers(true);
            }}
            className="px-5 py-2 bg-surface-container-high text-on-surface rounded-xl font-bold border border-outline/20 hover:bg-surface-container-highest transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-error-container p-4 text-sm text-error">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-2xl border border-slate-100/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-6 py-4 text-xs font-bold label-wide text-secondary">
                  Username
                </th>
                <th className="px-6 py-4 text-xs font-bold label-wide text-secondary">
                  Full Name
                </th>
                <th className="px-6 py-4 text-xs font-bold label-wide text-secondary">
                  Email
                </th>
                <th className="px-6 py-4 text-xs font-bold label-wide text-secondary">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-bold label-wide text-secondary">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold label-wide text-secondary">
                  Last Login
                </th>
                <th className="px-6 py-4 text-xs font-bold label-wide text-secondary">
                  Created
                </th>
                <th className="px-6 py-4 text-xs font-bold label-wide text-secondary text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-6 py-6 text-on-surface-variant" colSpan={8}>
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-on-surface-variant" colSpan={8}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-on-surface">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface">
                      {user.fullName}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface">
                      {getRoleLabel(user)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded-md text-[10px] font-black uppercase tracking-widest">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/admin/users/${user.id}/edit`, {
                            state: { user },
                          });
                        }}
                        className="p-2 text-outline hover:text-primary hover:bg-white rounded-lg transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">
                          edit
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div className="border-t border-slate-100 p-4 flex justify-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => {
                void loadUsers(false);
              }}
              className="px-5 py-2 bg-surface-container-high text-on-surface rounded-xl font-bold border border-outline/20 hover:bg-surface-container-highest transition-colors disabled:opacity-60"
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

