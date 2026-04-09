import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { login } from "../api";
import { Copy, Check } from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";

interface LoginProps {
  onLogin: (userData: any, token: string) => Promise<void>;
  siteSettings?: any;
  hasDefaultAdmin?: boolean;
  intendedDestination?: string | null;
  onForgotPassword?: () => void;
}

export default function Login({
  onLogin,
  hasDefaultAdmin = true,
  intendedDestination,
  onForgotPassword,
}: LoginProps) {
  const { t, i18n } = useTranslation("auth");
  const { siteSettings: contextSiteSettings } = useSettings(); // Use SettingsContext for settings
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Get current language for toggle
  // Note: i18next LanguageDetector automatically detects browser language on initial load
  // and saves it to localStorage. The language is already set when this component mounts.
  const currentLanguage = i18n.language || "en";

  // Handle language toggle on login page
  // For non-authenticated users: Changes language and saves to localStorage only
  // This has no effect until user logs in - then App.tsx will read localStorage and save to DB
  const handleLanguageToggle = async () => {
    const newLanguage = currentLanguage === "en" ? "fr" : "en";
    await i18n.changeLanguage(newLanguage);
    // i18next automatically saves to localStorage, which will be used when user logs in
  };
  const [googleOAuthEnabled, setGoogleOAuthEnabled] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [adminCredentials, setAdminCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [backendAvailable, setBackendAvailable] = useState<boolean>(true);
  const [checkingBackend, setCheckingBackend] = useState<boolean>(false);

  // Copy to clipboard function
  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemId);
      setTimeout(() => setCopiedItem(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  // Check if demo mode is enabled
  const isDemoMode = process.env.DEMO_ENABLED === "true";

  // Check backend availability on mount and periodically
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    let retryTimeout: NodeJS.Timeout;

    const checkBackendHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        // Use a lightweight endpoint for health check instead of /api/settings
        // This avoids duplicate settings fetches (SettingsContext handles settings)
        const response = await fetch("/api/auth/check-default-admin", {
          signal: controller.signal,
          cache: "no-store",
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          setBackendAvailable(true);
          setCheckingBackend(false);
          retryCount = 0; // Reset retry count on success
        } else {
          throw new Error("Backend responded with error");
        }
      } catch (error) {
        console.error("Backend health check failed:", error);
        retryCount++;

        if (retryCount >= maxRetries) {
          setBackendAvailable(false);
          setCheckingBackend(false);
        } else {
          // Retry after delay (exponential backoff: 2s, 4s, 8s)
          const delay = Math.min(2000 * Math.pow(2, retryCount - 1), 8000);
          retryTimeout = setTimeout(checkBackendHealth, delay);
        }
      }
    };

    // checkBackendHealth() removed — do not auto-check on mount

    // Cleanup timeout on unmount
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  // Fetch admin credentials only if demo mode is enabled
  useEffect(() => {
    if (!isDemoMode || !backendAvailable) {
      setAdminCredentials(null);
      return;
    }

    const fetchAdminCredentials = async () => {
      try {
        const response = await fetch("/api/auth/demo-credentials");
        if (response.ok) {
          const credentials = await response.json();
          setAdminCredentials(credentials.admin);
        }
      } catch (error) {
        console.error("Failed to fetch admin credentials:", error);
        // Fallback to default credentials
        setAdminCredentials({
          email: "admin@kanban.local",
          password: "admin",
        });
      }
    };

    fetchAdminCredentials();
  }, [isDemoMode, backendAvailable]);

  // Check for token expiration redirect
  useEffect(() => {
    const tokenExpired = sessionStorage.getItem("tokenExpiredRedirect");
    if (tokenExpired === "true") {
      setError(t("login.sessionExpired"));
      sessionStorage.removeItem("tokenExpiredRedirect");
    }
  }, [t]);

  // Check for OAuth errors in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");

    if (errorParam) {
      let errorMessage = t("login.loginFailed");

      switch (errorParam) {
        case "account_deactivated":
          errorMessage = t("login.accountDeactivated");
          break;
        case "user_not_invited":
          errorMessage = t("login.accessDenied");
          break;
        case "oauth_failed":
          errorMessage = t("login.oauthFailed");
          break;
        case "oauth_not_configured":
          errorMessage = t("login.oauthNotConfigured");
          break;
        case "oauth_userinfo_failed":
          errorMessage = t("login.oauthUserinfoFailed");
          break;
      }

      setError(errorMessage);

      // Clean up the URL by removing the error parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // Check if Google OAuth is configured - use SettingsContext instead of fetching
  useEffect(() => {
    // Use settings from SettingsContext (already fetched, no need for additional API call)
    if (contextSiteSettings && Object.keys(contextSiteSettings).length > 0) {
      // Only check for GOOGLE_CLIENT_ID (which is safe to be public)
      // The server will validate the complete OAuth config when actually used
      setGoogleOAuthEnabled(!!contextSiteSettings.GOOGLE_CLIENT_ID);
    }
  }, [contextSiteSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await login(email, password);
      await onLogin(response.user, response.token);
    } catch (error: any) {
      setError(error.response?.data?.error || t("login.loginFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!googleOAuthEnabled) {
      setError(
        "Google OAuth is not configured. Please contact an administrator.",
      );
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Store intended destination before OAuth redirect
      if (intendedDestination) {
        localStorage.setItem("oauthIntendedDestination", intendedDestination);
      } else {
        // Clear any stale intended destination for normal login
        localStorage.removeItem("oauthIntendedDestination");
      }

      // Redirect to Google OAuth
      const response = await fetch("/api/auth/google/url");
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        throw new Error("Failed to get Google OAuth URL");
      }
    } catch (error: any) {
      setError("Google sign-in failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center bg-[#f9f9ff] text-[#141b2c]">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-28 -left-24 h-80 w-80 rounded-full bg-[#dae2ff] blur-3xl opacity-70" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#d6e3fb] blur-3xl opacity-70" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <section className="w-full max-w-3xl">
            <div className="rounded-3xl bg-white p-6 shadow-[0_12px_40px_rgba(20,27,44,0.06)] sm:p-8">
              <div className="mb-6">
                <h3 className="mt-2 text-3xl font-black tracking-[-0.02em]">
                  {t("login.signInToAccount")}
                </h3>
                <p className="mt-2 text-sm text-[#434654]">
                  {t("login.welcome")}
                </p>
              </div>

              {!backendAvailable && !checkingBackend && (
                <div className="mb-5 rounded-2xl bg-[#fff4de] p-5 text-sm text-[#7a4c00]">
                  <h4 className="font-bold uppercase tracking-[0.08em]">
                    {t("login.systemUnavailable")}
                  </h4>
                  <p className="mt-2">{t("login.systemUnavailableMessage")}</p>
                  <p className="mt-1">{t("login.systemUnavailableContact")}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-4 rounded-xl bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#7a4c00] transition-all hover:bg-[#fff8ea]"
                  >
                    {t("login.retryConnection")}
                  </button>
                </div>
              )}

              {checkingBackend && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#e9edff] p-5 text-[#0040a2]">
                  <svg
                    className="h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <p className="text-sm font-semibold">
                    {t("login.connectingToServer")}
                  </p>
                </div>
              )}

              <form
                className="space-y-5"
                onSubmit={handleSubmit}
                style={{ display: backendAvailable ? "block" : "none" }}
              >
                <div className="space-y-3">
                  <label
                    htmlFor="email"
                    className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#737685]"
                  >
                    {t("login.emailAddress")}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl bg-[#f1f3ff] px-4 py-3 text-sm text-[#141b2c] placeholder:text-[#737685] outline-none ring-0 transition-all focus:bg-[#e9edff] focus:shadow-[0_0_0_2px_rgba(0,82,204,0.18)]"
                    placeholder={t("login.emailAddress")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="password"
                    className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#737685]"
                  >
                    {t("login.password")}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl bg-[#f1f3ff] px-4 py-3 text-sm text-[#141b2c] placeholder:text-[#737685] outline-none ring-0 transition-all focus:bg-[#e9edff] focus:shadow-[0_0_0_2px_rgba(0,82,204,0.18)]"
                    placeholder={t("login.password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition-all ${
                      isLoading
                        ? "cursor-not-allowed bg-[#8cb1eb]"
                        : "bg-gradient-to-br from-[#003d9b] to-[#0052cc] shadow-[0_12px_28px_rgba(0,82,204,0.25)] hover:scale-[1.01]"
                    }`}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      {isLoading && (
                        <svg
                          className="h-4 w-4 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      )}
                      {isLoading ? t("login.loading") : t("login.submit")}
                    </span>
                  </button>

                  {googleOAuthEnabled && (
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="w-full rounded-xl bg-[#f1f3ff] px-4 py-3 text-sm font-semibold text-[#141b2c] transition-all hover:bg-[#e9edff]"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        {t("login.signInWithGoogle")}
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {onForgotPassword && (
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0052cc] underline underline-offset-2"
                    >
                      {t("login.forgotYourPassword")}
                    </button>
                  )}
                </div>

                {isDemoMode && hasDefaultAdmin && adminCredentials && (
                  <div className="rounded-2xl bg-[#f1f3ff] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#737685]">
                      {t("login.demoCredentials")}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[#434654]">
                      Admin Account
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                        <span className="font-mono text-xs text-[#0052cc]">
                          {adminCredentials.email}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              adminCredentials.email,
                              "admin-email",
                            )
                          }
                          className="ml-2 rounded p-1 transition-colors hover:bg-[#f1f3ff]"
                          title={t("login.copyEmail")}
                        >
                          {copiedItem === "admin-email" ? (
                            <Check className="h-3.5 w-3.5 text-[#28a745]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-[#0052cc]" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                        <span className="font-mono text-xs text-[#0052cc]">
                          {adminCredentials.password}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              adminCredentials.password,
                              "admin-password",
                            )
                          }
                          className="ml-2 rounded p-1 transition-colors hover:bg-[#f1f3ff]"
                          title={t("login.copyPassword")}
                        >
                          {copiedItem === "admin-password" ? (
                            <Check className="h-3.5 w-3.5 text-[#28a745]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-[#0052cc]" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

