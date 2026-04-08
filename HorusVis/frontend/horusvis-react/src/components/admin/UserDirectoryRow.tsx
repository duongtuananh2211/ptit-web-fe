import type { CSSProperties } from "react";
import type { UserAdminDto } from "../../api/adminApi";

interface Props {
  user: UserAdminDto;
  onEdit: () => void;
}

const STATUS_STYLES: Record<string, CSSProperties> = {
  Active: { color: "white", background: "green" },
  Inactive: { color: "white", background: "grey" },
  Suspended: { color: "white", background: "#c0392b" },
};

const BADGE_BASE: CSSProperties = {
  padding: "2px 8px",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
};

export default function UserDirectoryRow({ user, onEdit }: Props) {
  const badgeStyle: CSSProperties = {
    ...BADGE_BASE,
    ...(STATUS_STYLES[user.status] ?? { background: "#888", color: "white" }),
  };

  const lastLogin = user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleDateString()
    : "—";

  return (
    <tr>
      <td>{user.username}</td>
      <td>{user.fullName}</td>
      <td>{user.email}</td>
      <td>{user.roleName}</td>
      <td>
        <span style={badgeStyle}>{user.status}</span>
      </td>
      <td>{lastLogin}</td>
      <td>
        <button onClick={onEdit}>Edit</button>
      </td>
    </tr>
  );
}
