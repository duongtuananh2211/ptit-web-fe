import React from 'react';
import type { CriticalIssue } from '../services/reportsService';

interface CriticalIssueItemProps {
  issue: CriticalIssue;
}

const formatReportedTime = (value: string) => {
  const elapsedMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(elapsedMs)) return 'unknown time';
  const hours = Math.max(0, Math.floor(elapsedMs / 3_600_000));
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const CriticalIssueItem: React.FC<CriticalIssueItemProps> = ({ issue }) => {
  const isCritical = issue.priority.toLowerCase() === 'critical';
  const isHigh = issue.priority.toLowerCase() === 'high';
  const priorityStyle = isCritical
    ? 'bg-error-container text-error'
    : isHigh
      ? 'bg-tertiary-fixed text-tertiary'
      : 'bg-secondary-fixed text-on-secondary-container';

  return (
    <div className="bg-surface-container-lowest p-4 rounded-lg border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded ${priorityStyle} flex items-center justify-center`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isCritical ? 'error' : 'bug_report'}
          </span>
        </div>
        <div>
          <h4 className="text-sm font-bold editorial-tight">{issue.issueCode}: {issue.title}</h4>
          <p className="text-xs text-on-surface-variant">
            {issue.severity} · {issue.status} · Reported {formatReportedTime(issue.openedAt)}
          </p>
        </div>
      </div>
      <span className={`px-2 py-1 ${priorityStyle} text-[10px] font-bold label-wide rounded`}>
        {issue.priority}
      </span>
    </div>
  );
};

export default CriticalIssueItem;
