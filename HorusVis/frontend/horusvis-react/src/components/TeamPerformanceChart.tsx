import React from 'react';
import type { TeamPerformanceItem } from '../services/reportsService';

interface TeamPerformanceChartProps {
  performance: TeamPerformanceItem[];
  maxPoints: number;
}

const TeamPerformanceChart: React.FC<TeamPerformanceChartProps> = ({ performance, maxPoints }) => {
  return (
    <div className="md:col-span-7 bg-surface-container-lowest p-8 rounded-xl border border-slate-100/50 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Team Performance</h3>
          <p className="text-sm text-on-surface-variant">Tasks completed and points per contributor (last 30 days)</p>
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-md bg-surface-container-low text-primary">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
          </button>
        </div>
      </div>
      <div className="space-y-6">
        {performance.map((contributor) => (
          <div key={contributor.userId}>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-on-surface">{contributor.fullName}</span>
              <span className="text-on-surface-variant">{contributor.tasksCompleted} tasks · {contributor.totalPoints} pts</span>
            </div>
            <div className="w-full h-8 bg-surface-container-low rounded-md overflow-hidden flex items-center px-1">
              <div className="h-6 primary-gradient rounded" style={{ width: `${maxPoints > 0 ? (contributor.totalPoints / maxPoints) * 100 : 0}%` }}></div>
            </div>
          </div>
        ))}
        {performance.length === 0 && <p className="text-sm text-on-surface-variant">No team performance data available.</p>}
      </div>
    </div>
  );
};

export default TeamPerformanceChart;
