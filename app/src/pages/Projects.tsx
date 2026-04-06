import React, { useEffect, useState } from 'react';
import { getProjects } from '../services/mockData';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  if (projects.length === 0) return null;

  const project = projects[0];
  const { tasks } = project;

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col">
        <div className="flex items-end justify-between">
          <div>
            <nav className="flex items-center gap-2 text-xs font-label uppercase tracking-widest text-outline mb-2">
              <span>Projects</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-on-surface">{project.title}</span>
            </nav>
            <h2 className="text-3xl font-black text-on-surface tracking-tight font-headline editorial-tight">Main Project Board</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface font-semibold rounded-xl hover:bg-surface-container-highest transition-all">
              <span className="material-symbols-outlined text-lg">filter_list</span>
              <span className="text-sm">Filter</span>
            </button>
            <button className="flex items-center gap-2 px-5 py-2 primary-gradient text-white font-bold rounded-xl shadow-lg hover:scale-102 active:scale-98 transition-all">
              <span className="material-symbols-outlined text-lg">add</span>
              <span className="text-sm">New Task</span>
            </button>
          </div>
        </div>
        <div className="h-px w-full bg-surface-container-highest mt-6"></div>
      </section>

      {/* Board Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* To Do Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-outline"></div>
              <h3 className="font-bold text-sm text-on-surface tracking-wide uppercase">To Do</h3>
              <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-[10px] font-bold text-on-surface-variant">{tasks.todo.length}</span>
            </div>
          </div>
          <div className="space-y-4">
            {tasks.todo.map((task: any) => (
              <div key={task.id} className="bg-surface-container-lowest p-5 rounded-xl transition-all hover:translate-y-[-2px] group shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase tracking-wider rounded">{task.priority}</span>
                </div>
                <h4 className="font-semibold text-on-surface text-sm mb-4 leading-relaxed">{task.title}</h4>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-outline">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    <span className="text-[11px] font-medium">{task.date}</span>
                  </div>
                  {task.assignee && <img src={task.assignee} className="w-6 h-6 rounded-full border-2 border-surface" alt="Assignee" />}
                  {task.assignees && (
                    <div className="flex -space-x-2">
                      {task.assignees.map((a: string, i: number) => (
                        <img key={i} src={a} className="w-6 h-6 rounded-full border-2 border-surface" alt="Assignee" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Working Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-container"></div>
              <h3 className="font-bold text-sm text-on-surface tracking-wide uppercase">Working</h3>
              <span className="bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full text-[10px] font-bold">{tasks.working.length}</span>
            </div>
          </div>
          <div className="space-y-4">
            {tasks.working.map((task: any) => (
              <div key={task.id} className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-l-4 border-primary-container transition-all hover:translate-y-[-2px] group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-1.5">
                    {task.priority === 'Critical' && <span className="w-2 h-2 rounded-full bg-tertiary"></span>}
                    <span className={`${task.priority === 'Critical' ? 'text-tertiary' : 'text-on-primary-fixed-variant bg-secondary-fixed px-2 py-0.5 rounded'} text-[10px] font-bold uppercase tracking-wider`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <h4 className="font-semibold text-on-surface text-sm mb-2 leading-relaxed">{task.title}</h4>
                {task.progress && (
                  <div className="w-full h-1 bg-surface-container-low rounded-full overflow-hidden mb-4">
                    <div className="h-full primary-gradient" style={{ width: `${task.progress}%` }}></div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${task.due === 'Due Today' ? 'text-primary-container' : 'text-outline'}`}>
                    <span className="material-symbols-outlined text-sm">{task.due === 'Due Today' ? 'schedule' : 'calendar_today'}</span>
                    <span className="text-[11px] font-bold uppercase">{task.due || task.date}</span>
                  </div>
                  <img src={task.assignee} className="w-6 h-6 rounded-full border-2 border-surface" alt="Assignee" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stuck Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-error"></div>
              <h3 className="font-bold text-sm text-on-surface tracking-wide uppercase">Stuck</h3>
              <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded-full text-[10px] font-bold">{tasks.stuck.length}</span>
            </div>
          </div>
          <div className="space-y-4">
            {tasks.stuck.map((task: any) => (
              <div key={task.id} className="bg-surface-container-lowest p-5 rounded-xl border border-error-container/30 transition-all hover:translate-y-[-2px] group shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-1 bg-tertiary-fixed text-on-tertiary-fixed-variant text-[10px] font-bold uppercase tracking-wider rounded">{task.priority}</span>
                </div>
                <h4 className="font-semibold text-on-surface text-sm mb-2 leading-relaxed">{task.title}</h4>
                <p className="text-[11px] text-error font-medium flex items-center gap-1 mb-4">
                  <span className="material-symbols-outlined text-xs">warning</span>
                  {task.warning}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-outline">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    <span className="text-[11px] font-medium">{task.date}</span>
                  </div>
                  <img src={task.assignee} className="w-6 h-6 rounded-full border-2 border-surface" alt="Assignee" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Done Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#28A745]"></div>
              <h3 className="font-bold text-sm text-on-surface tracking-wide uppercase">Done</h3>
              <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-[10px] font-bold text-on-surface-variant">{tasks.done.length}</span>
            </div>
          </div>
          <div className="space-y-4 opacity-70 grayscale-[0.3]">
            {tasks.done.map((task: any) => (
              <div key={task.id} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/20 transition-all hover:translate-y-[-2px]">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase tracking-wider rounded line-through">{task.priority}</span>
                  <span className="material-symbols-outlined text-[#28A745] text-sm">check_circle</span>
                </div>
                <h4 className="font-semibold text-on-surface text-sm mb-4 leading-relaxed line-through">{task.title}</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-outline">
                    <span className="material-symbols-outlined text-sm">task_alt</span>
                    <span className="text-[11px] font-medium">{task.completed}</span>
                  </div>
                  <img src={task.assignee} className="w-6 h-6 rounded-full border-2 border-surface" alt="Assignee" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAB */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="w-14 h-14 primary-gradient text-white rounded-full flex items-center justify-center shadow-[0_12px_40px_rgba(0,61,155,0.3)] hover:scale-110 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      </div>
    </div>
  );
};

export default Projects;
