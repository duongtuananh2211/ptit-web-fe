import FeaturePage from "../components/FeaturePage";

export default function LoginPage() {
  return (
    <FeaturePage
      accentClass="accent-sunrise"
      description="Authentication entry points, provider setup, and session bootstrap will be added here."
      endpoint="/api/auth/placeholder"
      notes={[
        "Login form components are not implemented yet.",
        "Session bootstrap can later consume authApi.getPlaceholder().",
        "Route exists and can be protected later without changing layout structure.",
      ]}
      title="Login"
    />
  );
}
