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

  clearToken() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("tokenExpiresAt");
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};

