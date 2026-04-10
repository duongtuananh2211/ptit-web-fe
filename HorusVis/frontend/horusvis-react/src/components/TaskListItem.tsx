import React from "react";
import type { MyTaskListItem } from "../services/myTasksService";

interface TaskListItemProps {
  task: MyTaskListItem;
  onShowDetails?: (task: MyTaskListItem) => void;
}

const TaskListItem: React.FC<TaskListItemProps> = ({ task, onShowDetails }) => {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-slate-100/50 shadow-sm flex items-center justify-between hover:translate-x-1 transition-all group">
      <div className="flex items-center gap-6">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            task.priority === "Critical"
              ? "bg-error-container text-error"
              : task.priority === "High"
                ? "bg-tertiary-fixed text-tertiary"
                : "bg-surface-container-high text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined">
            {task.blockedNote
              ? "warning"
              : typeof task.progressPercent === "number" &&
                  task.progressPercent > 0
                ? "sync"
                : "assignment"}
          </span>
        </div>
        <div>
          <h4 className="text-base font-bold text-on-surface editorial-tight">
            {task.title}
          </h4>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-outline">
              {task.contextLabel}
            </span>
            <div className="flex items-center gap-1 text-outline">
              <span className="material-symbols-outlined text-[14px]">
                calendar_today
              </span>
              <span className="text-[10px] font-bold uppercase">
                {task.completed || task.dueLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-8">
        {typeof task.progressPercent === "number" &&
          task.progressPercent > 0 && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold text-primary uppercase">
                {task.progressPercent}% Complete
              </span>
              <div className="w-32 h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                <div
                  className="h-full primary-gradient"
                  style={{ width: `${task.progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            task.priority === "Critical"
              ? "bg-tertiary text-on-tertiary"
              : task.priority === "High"
                ? "bg-secondary text-on-secondary"
                : "bg-surface-container-highest text-on-surface-variant"
          }`}
        >
          {task.priority}
        </span>
        <button
          type="button"
          onClick={() => onShowDetails?.(task)}
          className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-outline hover:text-primary hover:bg-white hover:border-primary transition-all group-hover:shadow-sm"
          aria-label={`Show details for ${task.title}`}
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default TaskListItem;

