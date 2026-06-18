import React from 'react';
import KanbanColumn from './KanbanColumn';
import { STATUS_ORDER, getTasksByStatus, isOverdueOrToday } from '../utils/taskUtils';
import { logger } from '../utils/api';

function KanbanBoard({ tasks, onEditTask, onDeleteTask, onUpdateStatus }) {
  const groups = getTasksByStatus(tasks);

  const handleDropTask = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      logger.info(`Drag task ${taskId} to ${newStatus}`);
      onUpdateStatus(taskId, newStatus);
    }
  };

  const sortedTasks = (status) => {
    const list = groups[status] || [];
    return list.sort((a, b) => {
      const aOverdue = isOverdueOrToday(a.dueDate);
      const bOverdue = isOverdueOrToday(b.dueDate);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  return (
    <div className="kanban-board">
      {STATUS_ORDER.map(status => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={sortedTasks(status)}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onDropTask={handleDropTask}
        />
      ))}
    </div>
  );
}

export default KanbanBoard;
