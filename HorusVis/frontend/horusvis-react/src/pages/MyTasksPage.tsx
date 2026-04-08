import FeaturePage from "../components/FeaturePage";

export default function MyTasksPage() {
  return (
    <FeaturePage
      accentClass="accent-mint"
      description="Personal queues, execution views, and prioritization surfaces will be added here."
      endpoint="/api/my-tasks/placeholder"
      notes={[
        "Store provider is already mounted for future task filters and UI state.",
        "Page route can later host drag-and-drop or board subroutes.",
        "Current component remains implementation-free by design.",
      ]}
      title="My Tasks"
    />
  );
}
