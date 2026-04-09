import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  adminUsersService,
  type AdminUserDto,
  type UpdateUserRequest,
} from "../services/adminUsersService";

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrator" },
  { value: "user", label: "User" },
];

const STATUS_OPTIONS = ["Active", "Inactive", "Locked"];

interface EditPageLocationState {
  user?: AdminUserDto;
}

const AdminEditUser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams<{ userId: string }>();
  const locationState = location.state as EditPageLocationState | null;

  const [user, setUser] = useState<AdminUserDto | null>(
    locationState?.user ?? null,
  );
  const [loadingUser, setLoadingUser] = useState(!locationState?.user);
  const [form, setForm] = useState<UpdateUserRequest>({
    fullName: locationState?.user?.fullName ?? "",
    email: locationState?.user?.email ?? "",
    status: locationState?.user?.status ?? "Active",
    roleCode: locationState?.user?.roleCode ?? "user",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      if (!userId) {
        setError("Invalid user id.");
        setLoadingUser(false);
        return;
      }

      if (locationState?.user?.id === userId) {
        setLoadingUser(false);
        return;
      }

      setLoadingUser(true);
      setError("");

      try {
        const found = await adminUsersService.findUserById(userId);
        if (!found) {
          setError("User not found.");
          setUser(null);
          return;
        }

        setUser(found);
        setForm({
          fullName: found.fullName,
          email: found.email,
          status: found.status,
          roleCode: found.roleCode,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load user.");
      } finally {
        setLoadingUser(false);
      }
    };

    void loadUser();
  }, [locationState?.user, userId]);

  const title = useMemo(() => {
    if (!user) {
      return "Edit User";
    }

    return `Edit User: ${user.username}`;
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      setError("Invalid user id.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await adminUsersService.updateUser(userId, form);
      navigate("/admin", {
        replace: true,
        state: { toast: "User updated successfully." },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
            Admin
          </p>
          <h2 className="text-3xl font-black text-on-surface editorial-tight mt-2">
            {title}
          </h2>
          <p className="text-on-surface-variant mt-1">
            Update an account using the Admin API.
          </p>
        </div>
        <Link
          to="/admin"
          className="px-4 py-2 bg-surface-container-high text-on-surface rounded-xl font-bold border border-outline/20 hover:bg-surface-container-highest transition-colors inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Admin
        </Link>
      </div>

      {error && (
        <div className="rounded-xl bg-error-container p-4 text-sm text-error">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        </div>
      )}

      {loadingUser ? (
        <div className="rounded-2xl bg-surface-container-lowest border border-slate-100/50 shadow-sm p-6 text-on-surface-variant">
          Loading user details...
        </div>
      ) : user ? (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container-lowest rounded-2xl border border-slate-100/50 shadow-sm p-5"
        >
          <input
            required
            value={form.fullName ?? ""}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, fullName: event.target.value }))
            }
            className="rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary/25"
            placeholder="Full Name"
          />
          <input
            required
            type="email"
            value={form.email ?? ""}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            className="rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary/25"
            placeholder="Email"
          />
          <select
            value={form.status ?? "Active"}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, status: event.target.value }))
            }
            className="rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary/25"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={form.roleCode ?? "user"}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, roleCode: event.target.value }))
            }
            className="rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary/25"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label} ({role.value})
              </option>
            ))}
          </select>

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-3 primary-gradient text-on-primary rounded-xl font-bold shadow-lg hover:scale-102 active:scale-98 transition-all disabled:opacity-60"
            >
              {submitting ? "Updating..." : "Update User"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="px-5 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold border border-outline/20 hover:bg-surface-container-highest transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl bg-surface-container-lowest border border-slate-100/50 shadow-sm p-6 text-on-surface-variant">
          No user data available for editing.
        </div>
      )}
    </div>
  );
};

export default AdminEditUser;

