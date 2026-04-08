import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAdminRoles,
  updateAdminUser,
  type UserAdminDto,
} from "../../api/adminApi";
import { useAuthStore } from "../../stores/auth-store-context";

interface Props {
  user: UserAdminDto | null;
  onClose: () => void;
}

type FormValues = {
  fullName: string;
  email: string;
  status: string;
  roleCode: string;
};

export default function EditUserDrawer({ user, onClose }: Props) {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: roles } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => fetchAdminRoles(accessToken!),
    enabled: !!accessToken,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      status: "Active",
      roleCode: "user",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        roleCode: user.roleCode,
      });
    }
  }, [user, reset]);

  if (!user) return null;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateAdminUser(user.id, values, accessToken!);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User updated");
      onClose();
    } catch {
      toast.error("Failed to update user");
    }
  });

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 900,
        }}
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          height: "100vh",
          width: 400,
          background: "#fff",
          boxShadow: "-4px 0 16px rgba(0,0,0,0.2)",
          zIndex: 901,
          padding: 24,
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Edit User</h2>
        <p style={{ color: "#666", marginTop: -8 }}>{user.username}</p>
        <form onSubmit={onSubmit}>
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
            <label>Status</label>
            <select
              {...register("status")}
              style={{ display: "block", width: "100%", boxSizing: "border-box" }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
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
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
