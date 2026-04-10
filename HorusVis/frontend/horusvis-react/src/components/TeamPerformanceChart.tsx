import React from 'react';

interface TeamPerformanceChartProps {
  performance: any[];
}

const TeamPerformanceChart: React.FC<TeamPerformanceChartProps> = ({ performance }) => {
  return (
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
        {performance.map((team: any, i: number) => (
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
  );
};

export default TeamPerformanceChart;
