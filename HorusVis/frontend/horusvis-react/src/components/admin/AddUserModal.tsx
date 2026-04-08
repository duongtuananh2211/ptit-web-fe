import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useHorusVisClient } from "../DataProvider/hooks";
import { CreateUserRequest } from "@horusvis-web/Reference";

interface Props {
  open: boolean;
  onClose: () => void;
}

type FormValues = {
  username: string;
  email: string;
  fullName: string;
  password: string;
  roleCode: string;
};

export default function AddUserModal({ open, onClose }: Props) {
  const { adminUsersClient, adminRolesClient } = useHorusVisClient();
  const queryClient = useQueryClient();

  const { data: roles } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => adminRolesClient.getRoles(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      roleCode: "user",
    },
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const req = new CreateUserRequest();
      req.init(values);
      await adminUsersClient.createUser(req);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User created");
      reset();
      onClose();
    } catch {
      toast.error("Failed to create user");
    }
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 24,
          minWidth: 400,
          maxWidth: 480,
          width: "100%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>Add User</h2>
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label>Username</label>
            <input
              {...register("username", {
                required: "Username is required",
                minLength: { value: 3, message: "Min 3 characters" },
                maxLength: { value: 50, message: "Max 50 characters" },
              })}
              style={{ display: "block", width: "100%", boxSizing: "border-box" }}
            />
            {errors.username && (
              <span style={{ color: "red", fontSize: 12 }}>
                {errors.username.message}
              </span>
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Email</label>
            <input
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email",
                },
              })}
              style={{ display: "block", width: "100%", boxSizing: "border-box" }}
            />
            {errors.email && (
              <span style={{ color: "red", fontSize: 12 }}>
                {errors.email.message}
              </span>
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Full Name</label>
            <input
              {...register("fullName", { required: "Full name is required" })}
              style={{ display: "block", width: "100%", boxSizing: "border-box" }}
            />
            {errors.fullName && (
              <span style={{ color: "red", fontSize: 12 }}>
                {errors.fullName.message}
              </span>
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Password</label>
            <input
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Min 8 characters" },
              })}
              style={{ display: "block", width: "100%", boxSizing: "border-box" }}
            />
            {errors.password && (
              <span style={{ color: "red", fontSize: 12 }}>
                {errors.password.message}
              </span>
            )}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Role</label>
            <select
              {...register("roleCode", { required: "Role is required" })}
              style={{ display: "block", width: "100%", boxSizing: "border-box" }}
            >
              {roles?.map((r) => (
                <option key={r.id} value={r.roleCode}>
                  {r.roleName}
                </option>
              ))}
            </select>
            {errors.roleCode && (
              <span style={{ color: "red", fontSize: 12 }}>
                {errors.roleCode.message}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
