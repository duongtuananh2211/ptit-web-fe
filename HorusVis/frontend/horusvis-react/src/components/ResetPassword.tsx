import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { login } from "../api";

interface ResetPasswordProps {
  token: string;
  onBackToLogin: () => void;
  onResetSuccess: () => void;
  onAutoLogin: (user: any, token: string) => Promise<void>;
}

export default function ResetPassword({
  token,
  onBackToLogin,
  onResetSuccess,
  onAutoLogin,
}: ResetPasswordProps) {
  const { t } = useTranslation("auth");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState("");

  // Helper function to translate backend messages
  // Maps English backend messages to translation keys
  const translateBackendMessage = (backendMessage: string): string => {
    const messageMap: Record<string, string> = {
      "Too many password reset attempts, please try again in 1 hour":
        "resetPassword.backendMessages.tooManyAttempts",
      "Token and new password are required":
        "resetPassword.backendMessages.tokenAndPasswordRequired",
      "Password must be at least 6 characters long":
        "resetPassword.backendMessages.passwordTooShort",
      "Invalid or expired reset token":
        "resetPassword.backendMessages.invalidOrExpiredToken",
      "Password has been reset successfully. You can now login with your new password.":
        "resetPassword.backendMessages.resetSuccess",
      "Token is required": "resetPassword.backendMessages.tokenRequired",
      "Failed to verify token": "resetPassword.backendMessages.failedToVerify",
    };

    const translationKey = messageMap[backendMessage];
    if (translationKey) {
      return t(translationKey);
    }
    // If no match found, return original message
    return backendMessage;
  };

  // Verify token on component mount
  useEffect(() => {
    if (!token || token.length < 10) {
      // Don't immediately fail - token might still be loading from URL
      if (token === "") {
        // Still waiting for token to be extracted from URL
        return;
      }
      setTokenValid(false);
      setError(t("resetPassword.noTokenProvided"));
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/password-reset/verify/${token}`);
        const data = await response.json();

        if (response.ok) {
          setTokenValid(true);
          setUserEmail(data.email);
        } else {
          setTokenValid(false);
          const translatedError = translateBackendMessage(data.error);
          setError(translatedError || t("resetPassword.invalidToken"));
        }
      } catch (error) {
        setTokenValid(false);
        setError(t("resetPassword.failedToVerifyToken"));
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password.length < 6) {
      setError(t("resetPassword.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("resetPassword.passwordsDoNotMatch"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/password-reset/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Password reset successful, now perform normal login with new password
        try {
          const loginResponse = await login(userEmail, password);
          // Use the normal login flow
          onAutoLogin(loginResponse.user, loginResponse.token);
        } catch (loginError) {
          // If auto-login fails, still show success but user can login manually
          console.warn("Auto-login after password reset failed:", loginError);
          onResetSuccess();
        }
      } else {
        const translatedError = translateBackendMessage(data.error);
        setError(translatedError || t("resetPassword.failedToReset"));
      }
    } catch (error) {
      setError(t("resetPassword.networkError"));
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while waiting for token or verifying token
  if (!token || token.length < 10 || tokenValid === null) {
    return (
      <div className="flex min-h-screen items-center bg-[#f9f9ff] text-[#141b2c]">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-28 -left-24 h-80 w-80 rounded-full bg-[#dae2ff] blur-3xl opacity-70" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#d6e3fb] blur-3xl opacity-70" />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <section className="w-full max-w-xl">
              <div className="rounded-3xl bg-white p-6 text-center shadow-[0_12px_40px_rgba(20,27,44,0.06)] sm:p-8">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[#0052cc]" />
                <p className="mt-4 text-sm text-[#434654]">
                  {!token || token.length < 10
                    ? t("resetPassword.loadingToken")
                    : t("resetPassword.verifyingToken")}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="flex min-h-screen items-center bg-[#f9f9ff] text-[#141b2c]">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-28 -left-24 h-80 w-80 rounded-full bg-[#dae2ff] blur-3xl opacity-70" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#d6e3fb] blur-3xl opacity-70" />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <section className="w-full max-w-xl">
              <div className="rounded-3xl bg-white p-6 shadow-[0_12px_40px_rgba(20,27,44,0.06)] sm:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#737685]">
                  Authentication
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.02em]">
                  {t("resetPassword.invalidLink")}
                </h2>
                <p className="mt-2 text-sm text-[#434654]">
                  {t("resetPassword.linkExpired")}
                </p>

                <div className="mt-5 rounded-xl bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
                  {error}
                </div>

                <div className="mt-5">
                  <button
                    onClick={onBackToLogin}
                    className="inline-flex items-center rounded-xl bg-[#f1f3ff] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#0052cc] transition-all hover:bg-[#e9edff]"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("resetPassword.backToLogin")}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // Valid token - show reset form
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
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#737685]">
                  Authentication
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.02em]">
                  {t("resetPassword.title")}
                </h2>
                <p className="mt-2 text-sm text-[#434654]">
                  {t("resetPassword.enterNewPassword", { email: userEmail })}
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-3">
                  <label
                    htmlFor="password"
                    className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#737685]"
                  >
                    {t("resetPassword.newPassword")}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      className="w-full rounded-xl bg-[#f1f3ff] px-4 py-3 pr-11 text-sm text-[#141b2c] placeholder:text-[#737685] outline-none ring-0 transition-all focus:bg-[#e9edff] focus:shadow-[0_0_0_2px_rgba(0,82,204,0.18)]"
                      placeholder={t("resetPassword.newPasswordPlaceholder")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-[#737685]" />
                      ) : (
                        <Eye className="h-4 w-4 text-[#737685]" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#737685]"
                  >
                    {t("resetPassword.confirmPassword")}
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      className="w-full rounded-xl bg-[#f1f3ff] px-4 py-3 pr-11 text-sm text-[#141b2c] placeholder:text-[#737685] outline-none ring-0 transition-all focus:bg-[#e9edff] focus:shadow-[0_0_0_2px_rgba(0,82,204,0.18)]"
                      placeholder={t(
                        "resetPassword.confirmPasswordPlaceholder",
                      )}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-[#737685]" />
                      ) : (
                        <Eye className="h-4 w-4 text-[#737685]" />
                      )}
                    </button>
                  </div>
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
                      {isLoading
                        ? t("resetPassword.resetting")
                        : t("resetPassword.submit")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="inline-flex items-center rounded-xl bg-[#f1f3ff] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#0052cc] transition-all hover:bg-[#e9edff]"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("resetPassword.backToLogin")}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

