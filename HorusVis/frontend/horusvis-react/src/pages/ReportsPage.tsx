import FeaturePage from "../components/FeaturePage";

export default function ReportsPage() {
  return (
    <FeaturePage
      accentClass="accent-rose"
      description="Visual reporting, analytics panels, and export workflows will be added here."
      endpoint="/api/reports/placeholder"
      notes={[
        "Layout is ready for charts, filters, and secondary toolbars.",
        "Routing foundation allows future drill-down report paths.",
        "API contract placeholder is available for later wiring.",
      ]}
      title="Reports"
    />
  );
}
