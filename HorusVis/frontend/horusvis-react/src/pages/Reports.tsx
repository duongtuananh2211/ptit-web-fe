import React, { useEffect, useState } from 'react';
import { reportsService, type ReportsData } from '../services/reportsService';
import StatCard from '../components/StatCard';
import BugDensityChart from '../components/BugDensityChart';
import TeamPerformanceChart from '../components/TeamPerformanceChart';
import CriticalIssueItem from '../components/CriticalIssueItem';

const Reports: React.FC = () => {
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    reportsService.getReports()
      .then((data) => {
        if (active) setReports(data);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load reports.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const { blob, fileName } = await reportsService.exportCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (exportError: unknown) {
      setError(exportError instanceof Error ? exportError.message : 'Failed to export report.');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !reports) {
    return <p className="py-12 text-center text-on-surface-variant">Loading reports...</p>;
  }

  if (!reports) {
    return (
      <div className="space-y-4" role="alert">
        <p className="text-error">{error || 'Reports are unavailable.'}</p>
        <button
          className="px-4 py-2 primary-gradient text-on-primary rounded-md text-sm font-semibold"
          onClick={() => setRefreshKey((key) => key + 1)}
        >
          Retry
        </button>
      </div>
    );
  }

  const maxPoints = Math.max(...reports.teamPerformance.map((item) => item.totalPoints), 0);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-on-surface editorial-tight">Visual Analytics</h2>
          <p className="text-on-surface-variant mt-1">Real-time performance monitoring and bug distribution.</p>
        </div>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 border border-outline-variant rounded-md text-sm font-medium hover:bg-surface-container-low transition-colors disabled:opacity-50"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export Report'}
          </button>
          <button
            className="px-4 py-2 primary-gradient text-on-primary rounded-md text-sm font-semibold shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {error && <p className="text-error" role="alert">{error}</p>}

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total Active Bugs" 
          value={reports.dashboard.totalActiveBugs} 
        />
        <StatCard 
          label="Avg Time to Close" 
          value={reports.dashboard.avgTimeToCloseHours == null
            ? 'N/A'
            : `${(reports.dashboard.avgTimeToCloseHours / 24).toFixed(1)}d`} 
        />
        <StatCard 
          label="Task Velocity" 
          value={`${reports.dashboard.taskVelocityPoints} pts`} 
        />
        <StatCard 
          label="Critical Priority" 
          value={reports.dashboard.criticalPriorityCount} 
        />
      </div>

      {/* Detailed Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <BugDensityChart bugs={reports.bugDensity} />
        <TeamPerformanceChart performance={reports.teamPerformance} maxPoints={maxPoints} />
      </div>

      {/* Critical Issues */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-on-surface">Top Critical Issues</h3>
          <div className="space-y-3">
            {reports.criticalIssues.map((issue) => (
              <CriticalIssueItem key={issue.id} issue={issue} />
            ))}
            {reports.criticalIssues.length === 0 && (
              <p className="text-sm text-on-surface-variant">No open issues found.</p>
            )}
          </div>
        </div>
        <div className="bg-primary-container p-6 rounded-xl text-on-primary-container relative overflow-hidden shadow-lg">
          <div className="relative z-10">
            <h3 className="text-lg font-bold editorial-tight mb-4">Recommendations</h3>
            {reports.recommendations.length > 0 ? (
              <div className="space-y-4">
                {reports.recommendations.map((recommendation) => (
                  <div key={recommendation.ruleKey}>
                    <h4 className="text-sm font-bold">{recommendation.title}</h4>
                    <p className="text-sm opacity-90 mt-1">{recommendation.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm opacity-90">No recommendations at this time.</p>
            )}
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20 transform translate-x-8 -translate-y-8">
            <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'wght' 700" }}>bolt</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
