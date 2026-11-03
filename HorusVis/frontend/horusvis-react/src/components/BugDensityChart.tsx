import React from 'react';
import type { BugDensityItem } from '../services/reportsService';

interface BugDensityChartProps {
  bugs: BugDensityItem[];
}

const segmentColors = ['#003d9b', '#ba1a1a', '#248a68', '#8c001d', '#a56a00'];

const buildSegments = (bugs: BugDensityItem[], total: number) => {
  let offset = 0;
  return bugs.map((item) => {
    const percentage = total > 0 ? (item.openCount / total) * 100 : 0;
    const segment = { item, percentage, offset };
    offset += percentage;
    return segment;
  });
};

const BugDensityChart: React.FC<BugDensityChartProps> = ({ bugs }) => {
  const total = bugs.reduce((sum, item) => sum + item.openCount, 0);
  const segments = buildSegments(bugs, total);

  return (
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
          {segments.map(({ item, percentage, offset }, index) => {
            return percentage > 0 ? (
              <circle
                key={item.featureArea}
                cx="18"
                cy="18"
                fill="transparent"
                r="15.9"
                stroke={segmentColors[index % segmentColors.length]}
                strokeDasharray={`${percentage} ${100 - percentage}`}
                strokeDashoffset={-offset}
                strokeWidth="3.5"
              />
            ) : null;
          })}
        </svg>
        <div className="absolute text-center">
          <span className="block text-2xl font-black">{total}</span>
          <span className="text-[10px] label-wide text-secondary">Total</span>
        </div>
      </div>
      <div className="mt-8 space-y-3">
        {bugs.map((item, index) => (
          <div key={item.featureArea} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: segmentColors[index % segmentColors.length] }}></span>
              <span>{item.featureArea}</span>
            </div>
            <span className="font-bold">{item.openCount} open / {item.resolvedCount} resolved</span>
          </div>
        ))}
        {bugs.length === 0 && <p className="text-sm text-on-surface-variant">No bug density data available.</p>}
      </div>
    </div>
  );
};

export default BugDensityChart;
