import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendIcon?: string;
  trendColor?: string;
  progressColor?: string;
  progressWidth: string;
  pulse?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, trend, trendIcon, trendColor, progressColor, progressWidth, pulse }) => {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-slate-100/50 flex flex-col gap-1 shadow-sm">
      <span className="text-xs font-bold label-wide text-secondary">{label}</span>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-black text-on-surface editorial-tight">{value}</span>
        {trend && (
          <span className={`${trendColor} text-xs font-bold mb-1.5 flex items-center`}>
            <span className="material-symbols-outlined text-sm">{trendIcon}</span> {trend}
          </span>
        )}
        {pulse && <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse mb-3"></div>}
      </div>
      <div className="mt-4 w-full h-1 bg-surface-variant rounded-full">
        <div className={`h-full ${progressColor || 'primary-gradient'} rounded-full`} style={{ width: progressWidth }}></div>
      </div>
    </div>
  );
};

export default StatCard;
