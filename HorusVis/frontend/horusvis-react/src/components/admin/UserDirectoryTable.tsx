import { useRef, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  fetchAdminUsers,
  type PagedUsersResponse,
  type UserAdminDto,
} from "../../api/adminApi";
import { useAuthStore } from "../../stores/auth-store-context";
import UserDirectoryRow from "./UserDirectoryRow";

interface Props {
  searchTerm: string;
  onEditUser: (user: UserAdminDto) => void;
}

export default function UserDirectoryTable({ searchTerm, onEditUser }: Props) {
  const { accessToken } = useAuthStore();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["admin", "users", searchTerm],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchAdminUsers(accessToken!, pageParam, 20),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PagedUsersResponse) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: !!accessToken,
  });

  const allUsers = data?.pages.flatMap((p) => p.data) ?? [];
  const filtered = searchTerm.trim()
    ? allUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : allUsers;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div>
      {isLoading && <p>Loading users...</p>}
      {isError && <p>Failed to load users.</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Username</th>
            <th style={{ textAlign: "left" }}>Full Name</th>
            <th style={{ textAlign: "left" }}>Email</th>
            <th style={{ textAlign: "left" }}>Role</th>
            <th style={{ textAlign: "left" }}>Status</th>
            <th style={{ textAlign: "left" }}>Last Login</th>
            <th style={{ textAlign: "left" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((user) => (
            <UserDirectoryRow
              key={user.id}
              user={user}
              onEdit={() => onEditUser(user)}
            />
          ))}
        </tbody>
      </table>
      <div ref={sentinelRef} style={{ height: 1 }} />
      {isFetchingNextPage && <p>Loading more...</p>}
    </div>
  );
}
