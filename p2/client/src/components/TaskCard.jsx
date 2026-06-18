import React, { useRef, useState, useEffect } from 'react';
import { isOverdueOrToday, formatDate, PRIORITY_LABELS } from '../utils/taskUtils';

function TaskCard({ task, onEdit, onDelete, onDragStart, onDragEnd }) {
  const cardRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const longPressTimer = useRef(null);

  const overdue = isOverdueOrToday(task.dueDate);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    if (onDragStart) onDragStart(task.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (onDragEnd) onDragEnd();
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);

    longPressTimer.current = setTimeout(() => {
      setIsDragging(true);
      if (cardRef.current) {
        cardRef.current.style.opacity = '0.5';
      }
      if (onDragStart) onDragStart(task.id);
    }, 200);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) {
      const touch = e.touches[0];
      const deltaY = Math.abs(touch.clientY - touchStartY);
      if (deltaY > 10 && longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      return;
    }

    e.preventDefault();
    const touch = e.touches[0];

    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elem) {
      const column = elem.closest('[data-status]');
      if (column) {
        const status = column.getAttribute('data-status');
        const event = new CustomEvent('touch-drop', {
          detail: { taskId: task.id, status },
          bubbles: true
        });
        column.dispatchEvent(event);
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsDragging(false);
    if (cardRef.current) {
      cardRef.current.style.opacity = '';
    }
    if (onDragEnd) onDragEnd();
  };

  return (
    <div
      ref={cardRef}
      className={`task-card ${overdue ? 'overdue' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="task-card-title">{task.title}</div>
      {task.description && (
        <div className="task-card-description">{task.description}</div>
      )}
      <div className="task-card-meta">
        <span className={`priority-tag ${task.priority}`}>
          {PRIORITY_LABELS[task.priority]}优先级
        </span>
      </div>
      <div className="task-card-footer">
        <div className="task-assignee">
          {task.assignee ? (
            <>
              <span className="assignee-avatar">
                {task.assignee.charAt(0).toUpperCase()}
              </span>
              <span>{task.assignee}</span>
            </>
          ) : (
            <span>未分配</span>
          )}
        </div>
        {task.dueDate && (
          <div className={`task-due-date ${overdue ? 'overdue' : ''}`}>
            {formatDate(task.dueDate)}
          </div>
        )}
      </div>
      <div className="task-card-actions">
        <button onClick={(e) => { e.stopPropagation(); onEdit && onEdit(task); }}>
          编辑
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(task.id); }}>
          删除
        </button>
      </div>
    </div>
  );
}

export default TaskCard;
