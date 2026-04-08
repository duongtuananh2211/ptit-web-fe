import { getApiBaseUrl } from "../lib/env";

function buildUrl(path: string) {
  const baseUrl = getApiBaseUrl();
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  return new URL(normalizedPath, normalizedBase).toString();
}

export async function apiGet<T>(path: string, init?: RequestInit) {
  const response = await fetch(buildUrl(path), {
    headers: {
      Accept: "application/json",
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiGetAuth<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiPostAuth<T>(
  path: string,
  body: unknown,
  token: string,
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`POST ${path} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiPutAuth<T>(
  path: string,
  body: unknown,
  token: string,
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`PUT ${path} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiDeleteAuth(
  path: string,
  token: string,
): Promise<void> {
  const response = await fetch(buildUrl(path), {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`DELETE ${path} failed with status ${response.status}`);
  }
}
