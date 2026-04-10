import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BoardTaskItem } from "../services/projectsService";

interface TaskCardProps {
  task: BoardTaskItem;
  isDone?: boolean;
  onEditTask?: (task: BoardTaskItem) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isDone, onEditTask }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-surface-container-lowest p-5 rounded-xl transition-all hover:translate-y-[-2px] group shadow-sm ${isDone ? "border border-outline-variant/20" : ""}`}
    >
      <div className="flex justify-between items-start mb-3">
        <span
          className={`px-2 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase tracking-wider rounded ${isDone ? "line-through" : ""}`}
        >
          {task.priority}
        </span>
        {isDone ? (
          <span className="material-symbols-outlined text-[#28A745] text-sm">
            check_circle
          </span>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEditTask?.(task);
            }}
            className="material-symbols-outlined text-outline opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label={`Edit ${task.title}`}
          >
            edit
          </button>
        )}
      </div>
      <h4
        className={`font-semibold text-on-surface text-sm mb-4 leading-relaxed ${isDone ? "line-through" : ""}`}
      >
        {task.title}
      </h4>
      {task.description ? (
        <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
          {task.description}
        </p>
      ) : null}
      {(task.progressPercent !== undefined || task.progress !== undefined) && (
        <div className="w-full h-1 bg-surface-container-low rounded-full overflow-hidden mb-4">
          <div
            className="h-full primary-gradient"
            style={{ width: `${task.progressPercent ?? task.progress}%` }}
          ></div>
        </div>
      )}
      {task.warning && (
        <p className="text-[11px] text-error font-medium flex items-center gap-1 mb-4">
          <span className="material-symbols-outlined text-xs">warning</span>
          {task.warning}
        </p>
      )}
      <div className="flex items-center justify-between mt-4">
        <div
          className={`flex items-center gap-2 ${task.due === "Due Today" ? "text-primary-container" : "text-outline"}`}
        >
          <span className="material-symbols-outlined text-sm">
            {task.due === "Due Today"
              ? "schedule"
              : isDone
                ? "task_alt"
                : "calendar_today"}
          </span>
          <span
            className={`text-[11px] font-medium ${task.due === "Due Today" ? "font-bold uppercase" : ""}`}
          >
            {task.completed || task.due || task.date}
          </span>
        </div>
        {!!task.assigneeDisplayName && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-on-surface-variant">
              @{task.assigneeDisplayName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;

