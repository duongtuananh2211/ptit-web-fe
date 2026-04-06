import React, { useEffect, useState } from 'react';
import { getStats } from '../services/mockData';

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
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-slate-100/50 flex flex-col gap-1 shadow-sm">
          <span className="text-xs font-bold label-wide text-secondary">Total Active Bugs</span>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-on-surface editorial-tight">{stats.activeBugs}</span>
            <span className="text-error text-xs font-bold mb-1.5 flex items-center">
              <span className="material-symbols-outlined text-sm">trending_up</span> 12%
            </span>
          </div>
          <div className="mt-4 w-full h-1 bg-surface-variant rounded-full">
            <div className="h-full bg-error rounded-full" style={{ width: '65%' }}></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-slate-100/50 flex flex-col gap-1 shadow-sm">
          <span className="text-xs font-bold label-wide text-secondary">Avg Time to Close</span>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-on-surface editorial-tight">{stats.avgTimeToClose}</span>
            <span className="text-[#28A745] text-xs font-bold mb-1.5 flex items-center">
              <span className="material-symbols-outlined text-sm">trending_down</span> 0.8d
            </span>
          </div>
          <div className="mt-4 w-full h-1 bg-surface-variant rounded-full">
            <div className="h-full primary-gradient rounded-full" style={{ width: '42%' }}></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-slate-100/50 flex flex-col gap-1 shadow-sm">
          <span className="text-xs font-bold label-wide text-secondary">Task Velocity</span>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-on-surface editorial-tight">{stats.taskVelocity}</span>
            <span className="text-[#28A745] text-xs font-bold mb-1.5 flex items-center">
              <span className="material-symbols-outlined text-sm">check_circle</span> Stable
            </span>
          </div>
          <div className="mt-4 w-full h-1 bg-surface-variant rounded-full">
            <div className="h-full bg-[#28A745] rounded-full" style={{ width: '88%' }}></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-slate-100/50 flex flex-col gap-1 shadow-sm">
          <span className="text-xs font-bold label-wide text-secondary">Critical Priority</span>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-on-surface editorial-tight">{stats.criticalPriority}</span>
            <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse mb-3"></div>
          </div>
          <div className="mt-4 w-full h-1 bg-surface-variant rounded-full">
            <div className="h-full bg-tertiary rounded-full" style={{ width: '15%' }}></div>
          </div>
        </div>
      </div>

      {/* Detailed Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Pie Chart Area */}
        <div className="md:col-span-5 bg-surface-container-lowest p-8 rounded-xl border border-slate-100/50 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Bug Density</h3>
              <p className="text-sm text-on-surface-variant">Distribution across features</p>
            </div>
            <span className="material-symbols-outlined text-outline">pie_chart</span>
          </div>
          <div className="relative aspect-square flex items-center justify-center">
            <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#e9edff" strokeWidth="3.5"></circle>
              {/* Simplified static pie representation */}
              <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#003d9b" strokeDasharray="40 100" strokeWidth="3.5"></circle>
              <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#525f73" strokeDasharray="25 100" strokeDashoffset="-40" strokeWidth="3.5"></circle>
              <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#ba1a1a" strokeDasharray="15 100" strokeDashoffset="-65" strokeWidth="3.5"></circle>
              <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#8c001d" strokeDasharray="20 100" strokeDashoffset="-80" strokeWidth="3.5"></circle>
            </svg>
            <div className="absolute text-center">
              <span className="block text-2xl font-black">{stats.activeBugs}</span>
              <span className="text-[10px] label-wide text-secondary">Total</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {stats.bugDensity.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span>{item.label}</span>
                </div>
                <span className="font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart Area */}
        <div className="md:col-span-7 bg-surface-container-lowest p-8 rounded-xl border border-slate-100/50 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Team Performance</h3>
              <p className="text-sm text-on-surface-variant">Task completion speed (pts/week)</p>
            </div>
            <div className="flex gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-md bg-surface-container-low text-primary">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
              </button>
            </div>
          </div>
          <div className="space-y-6">
            {stats.teamPerformance.map((team: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-on-surface">{team.name}</span>
                  <span className="text-on-surface-variant">{team.pts} pts</span>
                </div>
                <div className="w-full h-8 bg-surface-container-low rounded-md overflow-hidden flex items-center px-1">
                  <div className="h-6 primary-gradient rounded" style={{ width: `${team.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-between items-center p-4 bg-surface-container-low rounded-lg">
            <div className="flex gap-4">
              <div className="text-center">
                <span className="block text-xs font-bold label-wide text-secondary">Efficiency</span>
                <span className="text-sm font-bold">+14%</span>
              </div>
              <div className="border-l border-outline-variant h-8"></div>
              <div className="text-center">
                <span className="block text-xs font-bold label-wide text-secondary">Capacity</span>
                <span className="text-sm font-bold">128/150</span>
              </div>
            </div>
            <button className="text-primary text-xs font-bold label-wide flex items-center gap-1 hover:underline">
              View Roadmap <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Issues */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-on-surface">Top Critical Issues</h3>
          <div className="space-y-3">
            {stats.criticalIssues.map((issue: any, i: number) => (
              <div key={i} className="bg-surface-container-lowest p-4 rounded-lg border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded ${issue.bgColor} flex items-center justify-center ${issue.textColor}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {issue.id.includes('492') ? 'bug_report' : issue.id.includes('501') ? 'warning' : 'error'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold editorial-tight">{issue.id}: {issue.title}</h4>
                    <p className="text-xs text-on-surface-variant">{issue.type} • Reported {issue.time}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 ${issue.bgColor.includes('error') ? 'bg-tertiary text-on-tertiary' : 'bg-secondary text-on-secondary'} text-[10px] font-bold label-wide rounded`}>
                  {issue.priority}
                </span>
              </div>
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
