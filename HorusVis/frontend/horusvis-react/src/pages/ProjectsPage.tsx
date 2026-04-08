import FeaturePage from "../components/FeaturePage";

export default function ProjectsPage() {
  return (
    <FeaturePage
      accentClass="accent-cobalt"
      description="Project discovery, portfolio views, and dashboard entry points will be added here."
      endpoint="/api/projects/placeholder"
      notes={[
        "Route is ready for nested project detail flows.",
        "API module placeholder exists under src/api/scaffoldApi.ts.",
        "Page keeps only presentational scaffold and no data fetching side effects yet.",
      ]}
      title="Projects"
    />
  );
}
