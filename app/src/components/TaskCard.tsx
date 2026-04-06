import React from 'react';

interface TaskCardProps {
  task: any;
  isDone?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isDone }) => {
  return (
    <div className={`bg-surface-container-lowest p-5 rounded-xl transition-all hover:translate-y-[-2px] group shadow-sm ${isDone ? 'border border-outline-variant/20' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase tracking-wider rounded ${isDone ? 'line-through' : ''}`}>
          {task.priority}
        </span>
        {isDone ? (
          <span className="material-symbols-outlined text-[#28A745] text-sm">check_circle</span>
        ) : (
          <span className="material-symbols-outlined text-outline opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">edit</span>
        )}
      </div>
      <h4 className={`font-semibold text-on-surface text-sm mb-4 leading-relaxed ${isDone ? 'line-through' : ''}`}>
        {task.title}
      </h4>
      {task.progress !== undefined && (
        <div className="w-full h-1 bg-surface-container-low rounded-full overflow-hidden mb-4">
          <div className="h-full primary-gradient" style={{ width: `${task.progress}%` }}></div>
        </div>
      )}
      {task.warning && (
        <p className="text-[11px] text-error font-medium flex items-center gap-1 mb-4">
          <span className="material-symbols-outlined text-xs">warning</span>
          {task.warning}
        </p>
      )}
      <div className="flex items-center justify-between mt-4">
        <div className={`flex items-center gap-2 ${task.due === 'Due Today' ? 'text-primary-container' : 'text-outline'}`}>
          <span className="material-symbols-outlined text-sm">
            {task.due === 'Due Today' ? 'schedule' : isDone ? 'task_alt' : 'calendar_today'}
          </span>
          <span className={`text-[11px] font-medium ${task.due === 'Due Today' ? 'font-bold uppercase' : ''}`}>
            {task.completed || task.due || task.date}
          </span>
        </div>
        <div className="flex -space-x-2">
          {task.assignees ? (
            task.assignees.map((a: string, i: number) => (
              <img key={i} src={a} className="w-6 h-6 rounded-full border-2 border-surface" alt="Assignee" />
            ))
          ) : (
            <img src={task.assignee} className="w-6 h-6 rounded-full border-2 border-surface" alt="Assignee" />
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
