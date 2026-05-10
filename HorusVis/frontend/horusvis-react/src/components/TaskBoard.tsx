import React, { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { BoardTaskItem } from "../services/projectsService";
import BoardColumn from "./BoardColumn";
import TaskCard from "./TaskCard";

interface Column {
  id: string;
  title: string;
  tasks: BoardTaskItem[];
  dotColor: string;
  countColor?: string;
  isDone?: boolean;
}

interface TaskBoardProps {
  initialTasks: {
    todo: BoardTaskItem[];
    working: BoardTaskItem[];
    stuck: BoardTaskItem[];
    done: BoardTaskItem[];
  };
  onEditTask?: (task: BoardTaskItem) => void;
  onTaskColumnChange?: (payload: {
    task: BoardTaskItem;
    fromColumnId: string;
    toColumnId: string;
  }) => void | Promise<void>;
}

const buildColumns = (tasks: TaskBoardProps["initialTasks"]): Record<string, Column> => ({
    todo: {
      id: "todo",
      title: "To Do",
      tasks: tasks.todo,
      dotColor: "bg-outline",
    },
    working: {
      id: "working",
      title: "Working",
      tasks: tasks.working,
      dotColor: "bg-primary-container",
      countColor: "bg-primary-fixed text-on-primary-fixed",
    },
    stuck: {
      id: "stuck",
      title: "Stuck",
      tasks: tasks.stuck,
      dotColor: "bg-error",
      countColor: "bg-error-container text-on-error-container",
    },
    done: {
      id: "done",
      title: "Done",
      tasks: tasks.done,
      dotColor: "bg-[#28A745]",
      isDone: true,
    },
  });

const TaskBoard: React.FC<TaskBoardProps> = ({
  initialTasks,
  onEditTask,
  onTaskColumnChange,
}) => {
  const [columns, setColumns] = useState<Record<string, Column>>(
    buildColumns(initialTasks),
  );

  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [dragStartColumnId, setDragStartColumnId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setColumns(buildColumns(initialTasks));
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const findColumn = (id: string | number): string | undefined => {
    if (typeof id === "string" && id in columns) {
      return id;
    }

    return Object.keys(columns).find((key) =>
      columns[key].tasks.find((task) => task.id === id),
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    setDragStartColumnId(findColumn(event.active.id) ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeContainer = findColumn(active.id);
    const overContainer = findColumn(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer)
      return;

    setColumns((prev) => {
      const activeItems = prev[activeContainer].tasks;
      const overItems = prev[overContainer].tasks;

      const activeIndex = activeItems.findIndex(
        (item) => item.id === active.id,
      );
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
          tasks: prev[activeContainer].tasks.filter(
            (item) => item.id !== active.id,
          ),
        },
        [overContainer]: {
          ...prev[overContainer],
          tasks: [
            ...prev[overContainer].tasks.slice(0, newIndex),
            prev[activeContainer].tasks[activeIndex],
            ...prev[overContainer].tasks.slice(
              newIndex,
              prev[overContainer].tasks.length,
            ),
          ],
        },
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeContainer = findColumn(active.id);
    const overContainer = findColumn(over?.id || "");

    const movedTask = activeContainer
      ? columns[activeContainer].tasks.find((item) => item.id === active.id)
      : undefined;

    if (
      dragStartColumnId &&
      activeContainer &&
      dragStartColumnId !== activeContainer &&
      movedTask
    ) {
      await onTaskColumnChange?.({
        task: movedTask,
        fromColumnId: dragStartColumnId,
        toColumnId: activeContainer,
      });
    }

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer !== overContainer
    ) {
      setActiveId(null);
      setDragStartColumnId(null);
      return;
    }

    const activeIndex = columns[activeContainer].tasks.findIndex(
      (item) => item.id === active.id,
    );
    const overIndex = columns[overContainer].tasks.findIndex(
      (item) => item.id === over?.id,
    );

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
    setDragStartColumnId(null);
  };

  const activeTask = activeId
    ? Object.values(columns)
        .flatMap((c) => c.tasks)
        .find((t) => t.id === activeId)
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
            onEditTask={onEditTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeId && activeTask ? (
          <TaskCard
            task={activeTask}
            isDone={findColumn(activeId) === "done"}
            onEditTask={onEditTask}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TaskBoard;

