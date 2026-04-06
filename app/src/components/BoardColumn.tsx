import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

interface BoardColumnProps {
  id: string;
  title: string;
  tasks: any[];
  dotColor: string;
  countColor?: string;
  isDone?: boolean;
}

const BoardColumn: React.FC<BoardColumnProps> = ({ id, title, tasks, dotColor, countColor, isDone }) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
          <h3 className="font-bold text-sm text-on-surface tracking-wide uppercase">{title}</h3>
          <span className={`${countColor || 'bg-surface-container-high text-on-surface-variant'} px-2 py-0.5 rounded-full text-[10px] font-bold`}>
            {tasks.length}
          </span>
        </div>
        {!isDone && (
          <button className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-lg">more_horiz</span>
          </button>
        )}
      </div>
      <div ref={setNodeRef} className={`space-y-4 min-h-[100px] ${isDone ? 'opacity-70 grayscale-[0.3]' : ''}`}>
        <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} isDone={isDone} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export default BoardColumn;
