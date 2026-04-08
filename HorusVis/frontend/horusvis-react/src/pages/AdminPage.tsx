import FeaturePage from "../components/FeaturePage";

export default function AdminPage() {
  return (
    <FeaturePage
      accentClass="accent-vault"
      description="Administration, access control, and platform management surfaces will be added here."
      endpoint="/api/admin/placeholder"
      notes={[
        "Admin route is isolated and ready for guarded access.",
        "Shared store can later hold user role and tenant context.",
        "The page remains intentionally non-functional in this scaffold phase.",
      ]}
      title="Admin"
    />
  );
}

