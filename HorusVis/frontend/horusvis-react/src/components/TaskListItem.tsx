import React from 'react';

interface TaskListItemProps {
  task: any;
}

const TaskListItem: React.FC<TaskListItemProps> = ({ task }) => {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-slate-100/50 shadow-sm flex items-center justify-between hover:translate-x-1 transition-all group">
      <div className="flex items-center gap-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          task.priority === 'Critical' ? 'bg-error-container text-error' :
          task.priority === 'High' ? 'bg-tertiary-fixed text-tertiary' :
          'bg-surface-container-high text-on-surface-variant'
        }`}>
          <span className="material-symbols-outlined">
            {task.progress ? 'sync' : task.warning ? 'warning' : task.completed ? 'task_alt' : 'assignment'}
          </span>
        </div>
        <div>
          <h4 className="text-base font-bold text-on-surface editorial-tight">{task.title}</h4>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-outline">Project: Horus Cloud Migration</span>
            <div className="flex items-center gap-1 text-outline">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              <span className="text-[10px] font-bold uppercase">{task.date || task.due || task.completed}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-8">
        {task.progress && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold text-primary uppercase">{task.progress}% Complete</span>
            <div className="w-32 h-1.5 bg-surface-container-low rounded-full overflow-hidden">
              <div className="h-full primary-gradient" style={{ width: `${task.progress}%` }}></div>
            </div>
          </div>
        )}
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          task.priority === 'Critical' ? 'bg-tertiary text-on-tertiary' :
          task.priority === 'High' ? 'bg-secondary text-on-secondary' :
          'bg-surface-container-highest text-on-surface-variant'
        }`}>
          {task.priority}
        </span>
        <button className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-outline hover:text-primary hover:bg-white hover:border-primary transition-all group-hover:shadow-sm">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default TaskListItem;
