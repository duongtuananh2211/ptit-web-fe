const defaultApiBaseUrl = "https://localhost:7235";

export function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!configuredBaseUrl) {
    return defaultApiBaseUrl;
  }

  return configuredBaseUrl.replace(/\/$/, "");
}
