import { authService } from "./authService";

const API_BASE_URL = "http://localhost:5049";

export interface AdminUserDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roleCode: string;
  roleName: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

interface PagedUsersResponse {
  data: AdminUserDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
  roleCode: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  status?: string;
  roleCode?: string;
}

interface ListUsersParams {
  cursor?: string;
  pageSize?: number;
}

const getAuthHeaders = () => {
  const token = authService.getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const getErrorMessage = async (response: Response, fallback: string) => {
  const error = await response.json().catch(() => ({}));
  return error.value?.detail || error.detail || error.message || fallback;
};

export const adminUsersService = {
  async listUsers(params: ListUsersParams = {}): Promise<PagedUsersResponse> {
    const search = new URLSearchParams();

    if (params.cursor) {
      search.set("cursor", params.cursor);
    }

    search.set("pageSize", String(params.pageSize ?? 20));

    const query = search.toString();
    const response = await fetch(`${API_BASE_URL}/api/admin/users?${query}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `List users failed with status ${response.status}`,
        ),
      );
    }

    return response.json();
  },

  async createUser(data: CreateUserRequest): Promise<AdminUserDto> {
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `Create user failed with status ${response.status}`,
        ),
      );
    }

    return response.json();
  },

  async updateUser(
    userId: string,
    data: UpdateUserRequest,
  ): Promise<AdminUserDto> {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `Update user failed with status ${response.status}`,
        ),
      );
    }

    return response.json();
  },

  async findUserById(userId: string): Promise<AdminUserDto | null> {
    let cursor: string | undefined;

    for (let pageIndex = 0; pageIndex < 50; pageIndex += 1) {
      const response = await this.listUsers({ cursor, pageSize: 100 });
      const matched = response.data.find((user) => user.id === userId);
      if (matched) {
        return matched;
      }

      if (!response.hasMore || !response.nextCursor) {
        return null;
      }

      cursor = response.nextCursor;
    }

    return null;
  },

  async listAllUsers(pageSize = 100): Promise<AdminUserDto[]> {
    const allUsers: AdminUserDto[] = [];
    let cursor: string | undefined;

    for (let pageIndex = 0; pageIndex < 200; pageIndex += 1) {
      const response = await this.listUsers({ cursor, pageSize });
      allUsers.push(...response.data);

      if (!response.hasMore || !response.nextCursor) {
        break;
      }

      cursor = response.nextCursor;
    }

    return allUsers;
  },
};

