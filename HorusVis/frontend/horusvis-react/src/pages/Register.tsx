import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { registerSchema } from "../validation/authSchema";

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = async (name: string, value: string | boolean) => {
    try {
      const fieldValue = name === "termsAccepted" ? value : value;
      await registerSchema.validateAt(name, {
        fullName,
        username,
        email,
        password,
        confirmPassword,
        termsAccepted,
        [name]: fieldValue,
      });
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name as keyof typeof updated];
        return updated;
      });
    } catch (err) {
      if (err instanceof Error) {
        setFieldErrors((prev) => ({ ...prev, [name]: err.message }));
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate entire form
      await registerSchema.validate(
        {
          fullName,
          username,
          email,
          password,
          confirmPassword,
          termsAccepted,
        },
        { abortEarly: false },
      );
      setFieldErrors({});

      const response = await authService.register({
        username,
        email,
        fullName,
        password,
      });

      if (response.accessToken) {
        authService.setToken(response.accessToken, response.expiresAt);
        navigate("/projects");
      } else {
        // Registration successful (201 with empty body), redirect to login
        navigate("/login");
      }
    } catch (err) {
      if (err instanceof Error && "inner" in err) {
        // Yup ValidationError
        const validationErrors: typeof fieldErrors = {};
        (err as any).inner?.forEach((fieldError: any) => {
          validationErrors[fieldError.path] = fieldError.message;
        });
        setFieldErrors(validationErrors);
        setLoading(false);
        return;
      }

      const message =
        err instanceof Error
          ? err.message
          : "An error occurred during registration";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="label-wide text-xs font-bold text-secondary">
          Team onboarding
        </p>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface editorial-tight">
            Create a HorusVis account
          </h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Set up secure access for your team and start tracking delivery from
            day one.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-xl bg-error-container p-4 text-sm text-error">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-xs font-bold uppercase tracking-[0.18em] text-secondary"
              htmlFor="register-name"
            >
              Full name
            </label>
            <input
              autoComplete="name"
              className={`w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 transition focus:ring-2 focus:ring-primary/20 disabled:opacity-50 ${
                fieldErrors.fullName
                  ? "ring-error focus:ring-error/50"
                  : "ring-transparent"
              }`}
              disabled={loading}
              id="register-name"
              name="fullName"
              placeholder="Alex Thompson"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                validateField("fullName", e.target.value);
              }}
              onBlur={(e) => validateField("fullName", e.target.value)}
            />
            {fieldErrors.fullName && (
              <p className="text-xs text-error font-medium">
                {fieldErrors.fullName}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              className="text-xs font-bold uppercase tracking-[0.18em] text-secondary"
              htmlFor="register-username"
            >
              Username
            </label>
            <input
              autoComplete="username"
              className={`w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 transition focus:ring-2 focus:ring-primary/20 disabled:opacity-50 ${
                fieldErrors.username
                  ? "ring-error focus:ring-error/50"
                  : "ring-transparent"
              }`}
              disabled={loading}
              id="register-username"
              name="username"
              placeholder="alex_thompson"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                validateField("username", e.target.value);
              }}
              onBlur={(e) => validateField("username", e.target.value)}
            />
            {fieldErrors.username && (
              <p className="text-xs text-error font-medium">
                {fieldErrors.username}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-xs font-bold uppercase tracking-[0.18em] text-secondary"
            htmlFor="register-email"
          >
            Work email
          </label>
          <input
            autoComplete="email"
            className={`w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 transition focus:ring-2 focus:ring-primary/20 disabled:opacity-50 ${
              fieldErrors.email
                ? "ring-error focus:ring-error/50"
                : "ring-transparent"
            }`}
            disabled={loading}
            id="register-email"
            name="email"
            placeholder="name@company.com"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateField("email", e.target.value);
            }}
            onBlur={(e) => validateField("email", e.target.value)}
          />
          {fieldErrors.email && (
            <p className="text-xs text-error font-medium">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-xs font-bold uppercase tracking-[0.18em] text-secondary"
              htmlFor="register-password"
            >
              Password
            </label>
            <input
              autoComplete="new-password"
              className={`w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 transition focus:ring-2 focus:ring-primary/20 disabled:opacity-50 ${
                fieldErrors.password
                  ? "ring-error focus:ring-error/50"
                  : "ring-transparent"
              }`}
              disabled={loading}
              id="register-password"
              name="password"
              placeholder="Create a password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validateField("password", e.target.value);
              }}
              onBlur={(e) => validateField("password", e.target.value)}
            />
            {fieldErrors.password && (
              <p className="text-xs text-error font-medium">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              className="text-xs font-bold uppercase tracking-[0.18em] text-secondary"
              htmlFor="register-confirm"
            >
              Confirm password
            </label>
            <input
              autoComplete="new-password"
              className={`w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 transition focus:ring-2 focus:ring-primary/20 disabled:opacity-50 ${
                fieldErrors.confirmPassword
                  ? "ring-error focus:ring-error/50"
                  : "ring-transparent"
              }`}
              disabled={loading}
              id="register-confirm"
              name="confirmPassword"
              placeholder="Repeat your password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                validateField("confirmPassword", e.target.value);
              }}
              onBlur={(e) => validateField("confirmPassword", e.target.value)}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-error font-medium">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <label
          className={`flex items-start gap-3 rounded-xl p-4 text-sm transition ${
            fieldErrors.termsAccepted
              ? "bg-error-container text-error"
              : "bg-surface-container-low text-on-surface-variant"
          }`}
        >
          <input
            className="mt-0.5 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20 disabled:opacity-50"
            disabled={loading}
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => {
              setTermsAccepted(e.target.checked);
              validateField("termsAccepted", e.target.checked);
            }}
          />
          <span>
            I agree to the workspace policy and understand this account will be
            used for project delivery and internal access.
          </span>
        </label>
        {fieldErrors.termsAccepted && (
          <p className="text-xs text-error font-medium">
            {fieldErrors.termsAccepted}
          </p>
        )}

        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#003d9b_0%,#0052cc_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(0,61,155,0.24)] transition hover:scale-102 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
          type="submit"
        >
          <span className="material-symbols-outlined text-[18px]">
            {loading ? "hourglass_empty" : "person_add"}
          </span>
          {loading ? "Creating account..." : "Create account"}
        </button>

        <Link
          className="flex w-full items-center justify-center rounded-xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
          to="/login"
        >
          Back to sign in
        </Link>
      </form>

      <div className="rounded-2xl bg-surface-container-low p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
          Built for teams
        </p>
        <div className="mt-3 grid gap-2 text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Invite-friendly onboarding for new members
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Consistent visual language across every workspace screen
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Designed to scale into projects, tasks, and reporting
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-on-surface-variant">
        <span>Already have access?</span>
        <Link
          className="font-semibold text-primary transition hover:underline underline-offset-2"
          to="/login"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default Register;

