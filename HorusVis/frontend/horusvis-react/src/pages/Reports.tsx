import React, { useEffect, useState } from 'react';
import { getStats } from '../services/mockData';
import StatCard from '../components/StatCard';
import BugDensityChart from '../components/BugDensityChart';
import TeamPerformanceChart from '../components/TeamPerformanceChart';
import CriticalIssueItem from '../components/CriticalIssueItem';

const Reports: React.FC = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-on-surface editorial-tight">Visual Analytics</h2>
          <p className="text-on-surface-variant mt-1">Real-time performance monitoring and bug distribution.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-outline-variant rounded-md text-sm font-medium hover:bg-surface-container-low transition-colors">
            Export Report
          </button>
          <button className="px-4 py-2 primary-gradient text-on-primary rounded-md text-sm font-semibold shadow-sm hover:scale-105 active:scale-95 transition-all">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total Active Bugs" 
          value={stats.activeBugs} 
          trend="12%" trendIcon="trending_up" trendColor="text-error" 
          progressColor="bg-error" progressWidth="65%" 
        />
        <StatCard 
          label="Avg Time to Close" 
          value={stats.avgTimeToClose} 
          trend="0.8d" trendIcon="trending_down" trendColor="text-[#28A745]" 
          progressWidth="42%" 
        />
        <StatCard 
          label="Task Velocity" 
          value={stats.taskVelocity} 
          trend="Stable" trendIcon="check_circle" trendColor="text-[#28A745]" 
          progressColor="bg-[#28A745]" progressWidth="88%" 
        />
        <StatCard 
          label="Critical Priority" 
          value={stats.criticalPriority} 
          progressColor="bg-tertiary" progressWidth="15%" 
          pulse 
        />
      </div>

      {/* Detailed Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <BugDensityChart bugs={stats.bugDensity} total={stats.activeBugs} />
        <TeamPerformanceChart performance={stats.teamPerformance} />
      </div>

      {/* Critical Issues */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-on-surface">Top Critical Issues</h3>
          <div className="space-y-3">
            {stats.criticalIssues.map((issue: any, i: number) => (
              <CriticalIssueItem key={i} issue={issue} />
            ))}
          </div>
        </div>
        <div className="bg-primary-container p-6 rounded-xl text-on-primary-container relative overflow-hidden shadow-lg">
          <div className="relative z-10">
            <h3 className="text-lg font-bold editorial-tight mb-2">Automated Optimization</h3>
            <p className="text-sm opacity-90 mb-6">Our engine suggests shifting 2 resources from Mobile to Infra to meet the sprint deadline.</p>
            <button className="w-full py-2 bg-white text-primary font-bold rounded-md text-sm hover:bg-opacity-90 transition-all shadow-md">
              Accept Recommendation
            </button>
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
