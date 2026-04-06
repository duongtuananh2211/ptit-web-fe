import React from 'react';

interface BugDensityChartProps {
  bugs: any[];
  total: number;
}

const BugDensityChart: React.FC<BugDensityChartProps> = ({ bugs, total }) => {
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
          <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#003d9b" strokeDasharray="40 100" strokeWidth="3.5"></circle>
          <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#525f73" strokeDasharray="25 100" strokeDashoffset="-40" strokeWidth="3.5"></circle>
          <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#ba1a1a" strokeDasharray="15 100" strokeDashoffset="-65" strokeWidth="3.5"></circle>
          <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#8c001d" strokeDasharray="20 100" strokeDashoffset="-80" strokeWidth="3.5"></circle>
        </svg>
        <div className="absolute text-center">
          <span className="block text-2xl font-black">{total}</span>
          <span className="text-[10px] label-wide text-secondary">Total</span>
        </div>
      </div>
      <div className="mt-8 space-y-3">
        {bugs.map((item: any, i: number) => (
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
  );
};

export default BugDensityChart;
