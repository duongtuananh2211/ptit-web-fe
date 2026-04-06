import React, { useEffect, useState } from 'react';
import { getProjects } from '../services/mockData';
import TaskBoard from '../components/TaskBoard';

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

      {/* Board Grid with Drag and Drop */}
      <section>
        <TaskBoard initialTasks={tasks} />
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
