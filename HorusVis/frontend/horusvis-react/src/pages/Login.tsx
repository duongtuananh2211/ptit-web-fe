import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { loginSchema } from "../validation/authSchema";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = async (name: string, value: string) => {
    try {
      await loginSchema.validateAt(name, { email, password, [name]: value });
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
      await loginSchema.validate({ email, password }, { abortEarly: false });
      setFieldErrors({});

      const response = await authService.login({
        usernameOrEmail: email,
        password,
      });

      if (response.accessToken) {
        authService.setToken(response.accessToken, response.expiresAt);
        navigate("/projects");
      } else {
        setError(
          response.message ||
            "We couldn't verify your email or password. Please check and try again, or create a new account.",
        );
      }
    } catch (err) {
      if (err instanceof Error && "inner" in err) {
        // Yup ValidationError
        const validationErrors: typeof fieldErrors = {};
        (err as any).inner?.forEach((fieldError: any) => {
          validationErrors[fieldError.path] = fieldError.message;
        });
        setFieldErrors(validationErrors);
        return;
      }

      let message = "Something went wrong. Please try again.";
      if (err instanceof Error) {
        if (err.message.includes("401")) {
          message =
            "We couldn't verify your credentials. Please check your email and password.";
        } else if (err.message.includes("404")) {
          message =
            "We couldn't find an account with that email. Please check or sign up.";
        } else if (err.message.includes("500")) {
          message =
            "Our servers are having trouble. Please try again in a moment.";
        } else {
          message = err.message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="label-wide text-xs font-bold text-secondary">
          Workspace access
        </p>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface editorial-tight">
            Sign in to HorusVis
          </h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Use your verified work account to continue into the project
            workspace.
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

        <div className="space-y-2">
          <label
            className="text-xs font-bold uppercase tracking-[0.18em] text-secondary"
            htmlFor="login-email"
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
            id="login-email"
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

        <div className="space-y-2">
          <label
            className="text-xs font-bold uppercase tracking-[0.18em] text-secondary"
            htmlFor="login-password"
          >
            Password
          </label>
          <input
            autoComplete="current-password"
            className={`w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none ring-1 transition focus:ring-2 focus:ring-primary/20 disabled:opacity-50 ${
              fieldErrors.password
                ? "ring-error focus:ring-error/50"
                : "ring-transparent"
            }`}
            disabled={loading}
            id="login-password"
            name="password"
            placeholder="Enter your password"
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

        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#003d9b_0%,#0052cc_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(0,61,155,0.24)] transition hover:scale-102 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
          type="submit"
        >
          <span className="material-symbols-outlined text-[18px]">
            {loading ? "hourglass_empty" : "login"}
          </span>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="rounded-2xl bg-surface-container-low p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
          What you get
        </p>
        <div className="mt-3 grid gap-2 text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Role-based visibility into active work
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Tonal surfaces that match the dashboard shell
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Fast handoff into projects, tasks, and reports
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-on-surface-variant">
        <span>Need a new workspace account?</span>
        <Link
          className="font-semibold text-primary transition hover:underline underline-offset-2"
          to="/register"
        >
          Create account
        </Link>
      </div>
    </div>
  );
};

export default Login;

