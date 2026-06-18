import React, { useState, useMemo } from 'react';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  isOverdueOrToday,
  formatDate
} from '../utils/taskUtils';
import { logger } from '../utils/api';

function TaskList({ tasks, onEditTask, onDeleteTask }) {
  const [sortField, setSortField] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState('asc');

  const sortedTasks = useMemo(() => {
    const list = [...tasks];

    list.sort((a, b) => {
      const aOverdue = isOverdueOrToday(a.dueDate) ? 0 : 1;
      const bOverdue = isOverdueOrToday(b.dueDate) ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;

      let cmp = 0;
      switch (sortField) {
        case 'priority':
          cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        case 'assignee':
          cmp = (a.assignee || '').localeCompare(b.assignee || '');
          break;
        case 'dueDate':
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          cmp = aDate - bDate;
          break;
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        default:
          cmp = 0;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [tasks, sortField, sortDirection]);

  const handleSort = (field) => {
    logger.info(`Sort tasks by ${field}`);
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const total = tasks.length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const donePercent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>任务列表</h3>
        <div className="task-list-stats">
          <div className="stat-item">
            <span className="stat-value">{total}</span>
            <span className="stat-label">总任务</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{donePercent}%</span>
            <span className="stat-label">已完成</span>
          </div>
        </div>
      </div>
      <div className="task-table-wrapper">
        <table className="task-table">
          <thead>
            <tr>
              <th
                className={sortField === 'title' ? 'sorted' : ''}
                onClick={() => handleSort('title')}
              >
                标题 <SortIcon field="title" />
              </th>
              <th
                className={sortField === 'priority' ? 'sorted' : ''}
                onClick={() => handleSort('priority')}
              >
                优先级 <SortIcon field="priority" />
              </th>
              <th
                className={sortField === 'status' ? 'sorted' : ''}
                onClick={() => handleSort('status')}
              >
                状态 <SortIcon field="status" />
              </th>
              <th
                className={sortField === 'assignee' ? 'sorted' : ''}
                onClick={() => handleSort('assignee')}
              >
                指派人 <SortIcon field="assignee" />
              </th>
              <th
                className={sortField === 'dueDate' ? 'sorted' : ''}
                onClick={() => handleSort('dueDate')}
              >
                截止日期 <SortIcon field="dueDate" />
              </th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">暂无任务</div>
                </td>
              </tr>
            ) : (
              sortedTasks.map(task => {
                const overdue = isOverdueOrToday(task.dueDate);
                return (
                  <tr key={task.id} className={overdue ? 'overdue' : ''}>
                    <td style={{ fontWeight: 500 }}>{task.title}</td>
                    <td>
                      <span className={`priority-tag ${task.priority}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`status-badge ${task.status}`}></span>
                        {STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td>{task.assignee || '未分配'}</td>
                    <td className={overdue ? 'task-due-date overdue' : ''}>
                      {task.dueDate ? formatDate(task.dueDate) : '-'}
                    </td>
                    <td>
                      <div className="task-card-actions" style={{ marginTop: 0 }}>
                        <button onClick={() => onEditTask(task)}>编辑</button>
                        <button onClick={() => onDeleteTask(task.id)}>删除</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TaskList;
