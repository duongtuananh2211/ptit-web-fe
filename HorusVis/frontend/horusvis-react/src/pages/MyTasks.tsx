import React, { useEffect, useState } from 'react';
import { getProjects } from '../services/mockData';
import TaskListItem from '../components/TaskListItem';

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
          <TaskListItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

export default MyTasks;
