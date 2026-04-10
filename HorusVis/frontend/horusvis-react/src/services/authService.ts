const API_BASE_URL = "http://localhost:5049";

interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
}

interface AuthResponse {
  accessToken?: string;
  expiresAt?: string;
  message?: string;
  success?: boolean;
}

interface JwtPayload {
  exp?: number;
  role?: string | string[];
  roles?: string | string[];
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?:
    | string
    | string[];
}

const parseJwtPayload = (token: string): JwtPayload | null => {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const payload = window.atob(padded);
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
};

const normalizeRoleClaim = (value: string | string[] | undefined): string[] => {
  if (!value) {
    return [];
  }

  const roles = Array.isArray(value) ? value : [value];
  return roles.map((role) => role.toLowerCase());
};

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage =
        error.value?.detail ||
        error.detail ||
        error.message ||
        `Login failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json().catch(() => ({}));
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage =
        error.value?.detail ||
        error.detail ||
        error.message ||
        `Registration failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const contentLength = response.headers.get("content-length");
    if (!contentLength || contentLength === "0") {
      return {};
    }

    return response.json().catch(() => ({}));
  },

  setToken(token: string, expiresAt?: string) {
    localStorage.setItem("authToken", token);
    if (expiresAt) {
      localStorage.setItem("tokenExpiresAt", expiresAt);
    }
  },

  getToken() {
    return localStorage.getItem("authToken");
  },

  getTokenExpiresAt() {
    return localStorage.getItem("tokenExpiresAt");
  },

  isTokenExpired() {
    const expiresAt = this.getTokenExpiresAt();
    if (expiresAt) {
      const parsedExpiresAt = new Date(expiresAt);
      if (!Number.isNaN(parsedExpiresAt.getTime())) {
        return parsedExpiresAt.getTime() <= Date.now();
      }
    }

    const token = this.getToken();
    if (!token) {
      return true;
    }

    const payload = parseJwtPayload(token);
    if (!payload?.exp) {
      return false;
    }

    return payload.exp * 1000 <= Date.now();
  },

  getRoleCodes() {
    const token = this.getToken();
    if (!token) {
      return [] as string[];
    }

    const payload = parseJwtPayload(token);
    if (!payload) {
      return [] as string[];
    }

    return [
      ...normalizeRoleClaim(payload.role),
      ...normalizeRoleClaim(payload.roles),
      ...normalizeRoleClaim(
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
      ),
    ];
  },

  isAdmin() {
    const roles = this.getRoleCodes();
    return roles.includes("admin");
  },

  clearToken() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("tokenExpiresAt");
  },

  isAuthenticated() {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    if (this.isTokenExpired()) {
      this.clearToken();
      return false;
    }

    return true;
  },
};

