import React, { useEffect, useState } from 'react';
import { getProjects } from '../services/mockData';

const MyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    getProjects().then(projects => {
      const allTasks = [
        ...projects[0].tasks.todo,
        ...projects[0].tasks.working,
        ...projects[0].tasks.stuck,
        ...projects[0].tasks.done
      ];
      setTasks(allTasks);
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-on-surface editorial-tight">My Assignments</h2>
          <p className="text-on-surface-variant mt-1">Track your active contributions and upcoming deadlines.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
            <button className="px-4 py-1.5 bg-white text-primary font-bold text-xs rounded-md shadow-sm">List View</button>
            <button className="px-4 py-1.5 text-outline font-bold text-xs rounded-md">Board View</button>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task) => (
          <div key={task.id} className="bg-surface-container-lowest p-6 rounded-2xl border border-slate-100/50 shadow-sm flex items-center justify-between hover:translate-x-1 transition-all group">
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
        ))}
      </div>
    </div>
  );
};

export default MyTasks;
