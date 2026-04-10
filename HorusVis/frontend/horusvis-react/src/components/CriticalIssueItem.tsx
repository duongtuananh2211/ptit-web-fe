import React from 'react';

interface CriticalIssueItemProps {
  issue: any;
}

const CriticalIssueItem: React.FC<CriticalIssueItemProps> = ({ issue }) => {
  return (
    <div className="bg-surface-container-lowest p-4 rounded-lg border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors shadow-sm">
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
  );
};

export default CriticalIssueItem;
