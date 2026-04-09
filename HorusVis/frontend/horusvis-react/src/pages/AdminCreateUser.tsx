import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  adminUsersService,
  type CreateUserRequest,
} from "../services/adminUsersService";

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrator" },
  { value: "user", label: "User" },
];

const INITIAL_CREATE_FORM: CreateUserRequest = {
  username: "",
  email: "",
  fullName: "",
  password: "",
  roleCode: "user",
};

const AdminCreateUser = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateUserRequest>(INITIAL_CREATE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await adminUsersService.createUser(form);
      navigate("/admin", {
        replace: true,
        state: { toast: "User created successfully." },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
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
            Create User
          </h2>
          <p className="text-on-surface-variant mt-1">
            Create a new account using the Admin API.
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

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container-lowest rounded-2xl border border-slate-100/50 shadow-sm p-5"
      >
        <input
          required
          value={form.username}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, username: event.target.value }))
          }
          className="rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary/25"
          placeholder="Username"
        />
        <input
          required
          type="email"
          value={form.email}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, email: event.target.value }))
          }
          className="rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary/25"
          placeholder="Email"
        />
        <input
          required
          value={form.fullName}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, fullName: event.target.value }))
          }
          className="rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary/25"
          placeholder="Full Name"
        />
        <input
          required
          minLength={8}
          type="password"
          value={form.password}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, password: event.target.value }))
          }
          className="rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary/25"
          placeholder="Password (min 8 characters)"
        />
        <select
          value={form.roleCode}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, roleCode: event.target.value }))
          }
          className="md:col-span-2 rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 ring-transparent focus:ring-2 focus:ring-primary/25"
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
            {submitting ? "Creating..." : "Create User"}
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
    </div>
  );
};

export default AdminCreateUser;

