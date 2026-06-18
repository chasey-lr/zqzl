import React, { useState, useEffect, useRef } from 'react';
import TaskCard from './TaskCard';
import { STATUS_LABELS } from '../utils/taskUtils';

function KanbanColumn({ status, tasks, onEditTask, onDeleteTask, onDropTask }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const columnRef = useRef(null);

  useEffect(() => {
    const column = columnRef.current;
    if (!column) return;

    const handleTouchDrop = (e) => {
      const { taskId, status: dropStatus } = e.detail;
      if (dropStatus === status && onDropTask) {
        onDropTask(taskId, status);
      }
    };

    column.addEventListener('touch-drop', handleTouchDrop);
    return () => {
      column.removeEventListener('touch-drop', handleTouchDrop);
    };
  }, [status, onDropTask]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    const rect = columnRef.current.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onDropTask) {
      onDropTask(taskId, status);
    }
  };

  return (
    <div
      ref={columnRef}
      data-status={status}
      className={`kanban-column ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="kanban-column-header">
        <div className="kanban-column-title">
          <span className={`status-badge ${status}`}></span>
          <span>{STATUS_LABELS[status]}</span>
        </div>
        <span className="kanban-column-count">{tasks.length}</span>
      </div>
      <div className="kanban-cards">
        {tasks.length === 0 ? (
          <div className="empty-state">暂无任务</div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default KanbanColumn;
