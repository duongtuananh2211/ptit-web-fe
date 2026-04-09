import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Helper function to translate backend messages
  // Maps English backend messages to translation keys
  const translateBackendMessage = (backendMessage: string): string => {
    const messageMap: Record<string, string> = {
      "Too many password reset requests, please try again in 1 hour":
        "forgotPassword.backendMessages.tooManyRequests",
      "Email is required": "forgotPassword.backendMessages.emailRequired",
      "If an account with that email exists, you will receive a password reset link shortly.":
        "forgotPassword.backendMessages.resetLinkSent",
      "Failed to process password reset request":
        "forgotPassword.backendMessages.failedToProcess",
    };

    const translationKey = messageMap[backendMessage];
    if (translationKey) {
      return t(translationKey);
    }
    // If no match found, return original message
    return backendMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(translateBackendMessage(data.message));
        setSubmitted(true);
      } else {
        const translatedError = translateBackendMessage(data.error);
        setError(translatedError || t("forgotPassword.failedToSendResetEmail"));
      }
    } catch (error) {
      setError(t("forgotPassword.networkError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
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
                <div className="mb-6 text-center">
                  <h3 className="mt-2 text-3xl font-black tracking-[-0.02em]">
                    {t("forgotPassword.checkYourEmail")}
                  </h3>
                  <p className="mt-2 text-sm text-[#434654]">
                    {t("forgotPassword.resetInstructionsSent")}
                  </p>
                </div>

                <div className="rounded-xl bg-[#d7f5dd] px-4 py-3 text-sm font-medium text-[#0f5a1a]">
                  {message}
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={onBackToLogin}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#f1f3ff] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#0052cc] transition-all hover:bg-[#e9edff]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t("forgotPassword.backToLogin")}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

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
              <div className="mb-6 text-center">
                <h3 className="mt-2 text-3xl font-black tracking-[-0.02em]">
                  {t("forgotPassword.title")}
                </h3>
                <p className="mt-2 text-sm text-[#434654]">
                  {t("forgotPassword.description")}
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-3">
                  <label
                    htmlFor="email"
                    className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#737685]"
                  >
                    {t("forgotPassword.emailAddress")}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl bg-[#f1f3ff] px-4 py-3 text-sm text-[#141b2c] placeholder:text-[#737685] outline-none ring-0 transition-all focus:bg-[#e9edff] focus:shadow-[0_0_0_2px_rgba(0,82,204,0.18)]"
                    placeholder={t("forgotPassword.emailAddress")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                      {isLoading
                        ? t("forgotPassword.sending")
                        : t("forgotPassword.sendResetLink")}
                    </span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#0052cc] underline underline-offset-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t("forgotPassword.backToLogin")}
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

