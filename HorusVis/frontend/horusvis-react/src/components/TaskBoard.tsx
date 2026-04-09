import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import BoardColumn from './BoardColumn';
import TaskCard from './TaskCard';

interface Task {
  id: string | number;
  title: string;
  priority: string;
  date?: string;
  due?: string;
  completed?: string;
  progress?: number;
  warning?: string;
  assignee?: string;
  assignees?: string[];
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  dotColor: string;
  countColor?: string;
  isDone?: boolean;
}

interface TaskBoardProps {
  initialTasks: {
    todo: Task[];
    working: Task[];
    stuck: Task[];
    done: Task[];
  };
}

const TaskBoard: React.FC<TaskBoardProps> = ({ initialTasks }) => {
  const [columns, setColumns] = useState<Record<string, Column>>({
    todo: { id: 'todo', title: 'To Do', tasks: initialTasks.todo, dotColor: 'bg-outline' },
    working: { id: 'working', title: 'Working', tasks: initialTasks.working, dotColor: 'bg-primary-container', countColor: 'bg-primary-fixed text-on-primary-fixed' },
    stuck: { id: 'stuck', title: 'Stuck', tasks: initialTasks.stuck, dotColor: 'bg-error', countColor: 'bg-error-container text-on-error-container' },
    done: { id: 'done', title: 'Done', tasks: initialTasks.done, dotColor: 'bg-[#28A745]', isDone: true },
  });

  const [activeId, setActiveId] = useState<string | number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumn = (id: string | number) => {
    if (id in columns) return id;
    return Object.keys(columns).find((key) => columns[key].tasks.find((task) => task.id === id));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeContainer = findColumn(active.id);
    const overContainer = findColumn(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((prev) => {
      const activeItems = prev[activeContainer].tasks;
      const overItems = prev[overContainer].tasks;

      const activeIndex = activeItems.findIndex((item) => item.id === active.id);
      const overIndex = overItems.findIndex((item) => item.id === overId);

      let newIndex: number;
      if (overId in prev) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowLastItem = over && overIndex === overItems.length - 1;
        const modifier = isBelowLastItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return {
        ...prev,
        [activeContainer]: {
          ...prev[activeContainer],
          tasks: prev[activeContainer].tasks.filter((item) => item.id !== active.id),
        },
        [overContainer]: {
          ...prev[overContainer],
          tasks: [
            ...prev[overContainer].tasks.slice(0, newIndex),
            prev[activeContainer].tasks[activeIndex],
            ...prev[overContainer].tasks.slice(newIndex, prev[overContainer].tasks.length),
          ],
        },
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeContainer = findColumn(active.id);
    const overContainer = findColumn(over?.id || '');

    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      setActiveId(null);
      return;
    }

    const activeIndex = columns[activeContainer].tasks.findIndex((item) => item.id === active.id);
    const overIndex = columns[overContainer].tasks.findIndex((item) => item.id === over?.id);

    if (activeIndex !== overIndex) {
      setColumns((prev) => ({
        ...prev,
        [overContainer]: {
          ...prev[overContainer],
          tasks: arrayMove(prev[overContainer].tasks, activeIndex, overIndex),
        },
      }));
    }

    setActiveId(null);
  };

  const activeTask = activeId 
    ? Object.values(columns).flatMap(c => c.tasks).find(t => t.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.values(columns).map((col) => (
          <BoardColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={col.tasks}
            dotColor={col.dotColor}
            countColor={col.countColor}
            isDone={col.isDone}
          />
        ))}
      </div>
      <DragOverlay>
        {activeId && activeTask ? (
          <TaskCard task={activeTask} isDone={findColumn(activeId) === 'done'} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TaskBoard;
