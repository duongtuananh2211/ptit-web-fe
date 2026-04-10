import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ValidationError } from "yup";
import ActionToast from "../components/ActionToast";
import { TextInput } from "../components/FormFields";
import {
  adminUsersService,
  type AdminUserDto,
} from "../services/adminUsersService";
import {
  projectsService,
  type AddProjectMemberRequest,
  type ProjectMember,
} from "../services/projectsService";
import { addProjectMemberSchema } from "../validation/projectSchema";

const INITIAL_ADD_FORM: AddProjectMemberRequest = {
  userId: "",
  projectRole: "Member",
};

type MemberFormErrors = Partial<Record<keyof AddProjectMemberRequest, string>>;

const formatDateTime = (value: string): string => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString();
};

const ProjectMembers = () => {
  const { projectId = "" } = useParams();

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState("");

  const [form, setForm] = useState<AddProjectMemberRequest>(INITIAL_ADD_FORM);
  const [userQuery, setUserQuery] = useState("");
  const [allUsers, setAllUsers] = useState<AdminUserDto[]>([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<MemberFormErrors>({});

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const updateField = <K extends keyof AddProjectMemberRequest>(
    key: K,
    value: AddProjectMemberRequest[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const mapValidationErrors = (
    validationError: ValidationError,
  ): MemberFormErrors => {
    const nextErrors: MemberFormErrors = {};

    validationError.inner.forEach((entry) => {
      if (!entry.path) {
        return;
      }

      const key = entry.path as keyof AddProjectMemberRequest;
      if (!nextErrors[key]) {
        nextErrors[key] = entry.message;
      }
    });

    return nextErrors;
  };

  const loadMembers = async () => {
    if (!projectId) {
      setError("Invalid project id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await projectsService.listProjectMembers(projectId);
      setMembers(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMembers();
  }, [projectId]);

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);

      try {
        const users = await adminUsersService.listAllUsers();
        setAllUsers(users);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load users for autocomplete.",
        );
      } finally {
        setLoadingUsers(false);
      }
    };

    void loadUsers();
  }, []);

  const normalizedQuery = userQuery.trim().toLowerCase();
  const filteredUsers = normalizedQuery
    ? allUsers
        .filter(
          (user) =>
            user.username.toLowerCase().includes(normalizedQuery) ||
            user.email.toLowerCase().includes(normalizedQuery) ||
            user.fullName.toLowerCase().includes(normalizedQuery),
        )
        .slice(0, 8)
    : [];

  const selectedUser = allUsers.find((user) => user.id === form.userId) ?? null;

  const handleAddMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId) {
      setError("Invalid project id.");
      return;
    }

    setError("");
    setFieldErrors({});

    if (!form.userId) {
      setFieldErrors({ userId: "Please select a user from suggestions" });
      return;
    }

    try {
      await addProjectMemberSchema.validate(form, { abortEarly: false });
    } catch (err) {
      if (err instanceof ValidationError) {
        setFieldErrors(mapValidationErrors(err));
        return;
      }

      setError("Invalid member form data.");
      return;
    }

    setSubmitting(true);
    try {
      const added = await projectsService.addProjectMember(projectId, form);
      setMembers((prev) => [added, ...prev]);
      setForm(INITIAL_ADD_FORM);
      setUserQuery("");
      setShowUserSuggestions(false);
      showToast("Member added successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!projectId) {
      setError("Invalid project id.");
      return;
    }

    setError("");
    setRemovingId(memberId);

    try {
      await projectsService.removeProjectMember(projectId, memberId);
      setMembers((prev) => prev.filter((member) => member.memberId !== memberId));
      showToast("Member removed successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member.");
    } finally {
      setRemovingId("");
    }
  };

  return (
    <div className="space-y-8">
      <ActionToast
        visible={toastVisible}
        message={toastMessage}
        onClose={() => setToastVisible(false)}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
            Projects
          </p>
          <h2 className="text-3xl font-black text-on-surface editorial-tight mt-2">
            Manage Members
          </h2>
          <p className="text-on-surface-variant mt-1">
            Add or remove members for this project.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadMembers()}
            className="px-4 py-2 bg-surface-container-high text-on-surface rounded-xl font-bold border border-outline/20 hover:bg-surface-container-highest transition-colors inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Refresh
          </button>
          <Link
            to={projectId ? `/projects/${projectId}` : "/projects"}
            className="px-4 py-2 bg-surface-container-high text-on-surface rounded-xl font-bold border border-outline/20 hover:bg-surface-container-highest transition-colors inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Detail
          </Link>
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

      <form
        onSubmit={handleAddMember}
        noValidate
        className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container-lowest rounded-2xl border border-slate-100/50 shadow-sm p-5"
      >
        <div className="md:col-span-2 relative">
          <TextInput
            label="User (email or username)"
            value={userQuery}
            onFocus={() => setShowUserSuggestions(true)}
            onBlur={() => {
              window.setTimeout(() => setShowUserSuggestions(false), 120);
            }}
            onChange={(event) => {
              setUserQuery(event.target.value);
              setShowUserSuggestions(true);
              updateField("userId", "");
            }}
            placeholder="Type username or email"
            error={fieldErrors.userId}
          />

          {showUserSuggestions && filteredUsers.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-56 overflow-auto rounded-xl border border-outline-variant/40 bg-white shadow-lg">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    updateField("userId", user.id);
                    setUserQuery(`${user.username} (${user.email})`);
                    setShowUserSuggestions(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-surface-container-low transition-colors"
                >
                  <p className="text-sm font-semibold text-on-surface">{user.username}</p>
                  <p className="text-xs text-on-surface-variant">{user.email}</p>
                </button>
              ))}
            </div>
          )}

          <div className="mt-1">
            {loadingUsers ? (
              <p className="text-xs text-on-surface-variant">Loading users...</p>
            ) : selectedUser ? (
              <p className="text-xs text-on-surface-variant">
                Selected: <span className="font-semibold">{selectedUser.username}</span> ({selectedUser.email})
              </p>
            ) : (
              <p className="text-xs text-on-surface-variant">
                Select a user from suggestions.
              </p>
            )}
          </div>
        </div>

        <TextInput
          label="Project Role"
          value={form.projectRole}
          onChange={(event) => updateField("projectRole", event.target.value)}
          placeholder="Member"
          error={fieldErrors.projectRole}
        />

        <div className="md:col-span-3 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-3 primary-gradient text-on-primary rounded-xl font-bold shadow-lg hover:scale-102 active:scale-98 transition-all disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add Member"}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(INITIAL_ADD_FORM);
              setUserQuery("");
              setShowUserSuggestions(false);
              setFieldErrors({});
            }}
            className="px-5 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold border border-outline/20 hover:bg-surface-container-highest transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      <section className="bg-surface-container-lowest rounded-2xl border border-slate-100/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-6 py-4 text-xs font-bold label-wide text-secondary">
                  Member
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
                  Joined At
                </th>
                <th className="px-6 py-4 text-xs font-bold label-wide text-secondary text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-6 py-6 text-on-surface-variant" colSpan={6}>
                    Loading members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-on-surface-variant" colSpan={6}>
                    No members found.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.memberId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatarUrl}
                          alt={member.displayName}
                          className="h-8 w-8 rounded-full border border-outline-variant"
                        />
                        <div>
                          <p className="text-sm font-bold text-on-surface">{member.displayName}</p>
                          <p className="text-xs text-on-surface-variant">{member.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{member.email || "-"}</td>
                    <td className="px-6 py-4 text-sm text-on-surface">{member.projectRole}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded-md text-[10px] font-black uppercase tracking-widest">
                        {member.memberStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {formatDateTime(member.joinedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        disabled={removingId === member.memberId}
                        onClick={() => {
                          void handleRemoveMember(member.memberId);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-error-container text-error text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
                      >
                        {removingId === member.memberId ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-100/70 bg-surface-container-low p-4 text-sm text-on-surface-variant">
        Tip: start typing username or email, then pick from autocomplete. The
        selected user id is sent to API behind the scenes.
      </div>
    </div>
  );
};

export default ProjectMembers;
