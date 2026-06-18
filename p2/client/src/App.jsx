import React, { useState, useEffect, useCallback } from 'react';
import KanbanBoard from './components/KanbanBoard';
import TaskList from './components/TaskList';
import TaskModal from './components/TaskModal';
import Notification from './components/Notification';
import HealthStatus from './components/HealthStatus';
import { api, logger } from './utils/api';
import { hasAssigneeAnyTasks } from './utils/taskUtils';

function App() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('kanban');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  const showNotification = (title, message, type = 'success') => {
    setNotification({ title, message, type, id: Date.now() });
  };

  const fetchTasks = useCallback(async () => {
    try {
      logger.info('Fetching tasks');
      const data = await api.getTasks();
      setTasks(data);
      logger.info(`Fetched ${data.length} tasks`);
    } catch (err) {
      logger.error('Failed to fetch tasks', err.message);
      showNotification('加载失败', '无法加载任务列表', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleEditTask = (task) => {
    logger.info(`Edit task: ${task.id}`);
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('确定要删除这个任务吗？')) return;

    logger.info(`Delete task: ${taskId}`);
    try {
      await api.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      showNotification('删除成功', '任务已删除');
      logger.info(`Task deleted: ${taskId}`);
    } catch (err) {
      logger.error('Failed to delete task', err.message);
      showNotification('删除失败', err.message || '无法删除任务', 'error');
    }
  };

  const handleSubmitTask = async (taskData) => {
    try {
      if (editingTask) {
        logger.info(`Update task: ${editingTask.id}`);
        const updated = await api.updateTask(editingTask.id, taskData);
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        showNotification('更新成功', '任务已更新');
      } else {
        logger.info('Create new task', taskData);
        const newTask = await api.createTask(taskData);

        if (taskData.assignee && taskData.assignee.trim()) {
          const assignee = taskData.assignee.trim();
          const hasOtherTasks = hasAssigneeAnyTasks(tasks, assignee);
          if (!hasOtherTasks) {
            setTimeout(() => {
              showNotification(
                '欢迎开始！',
                `${assignee}，欢迎开始你的第一个任务！`,
                'success'
              );
            }, 500);
          }
        }

        setTasks(prev => [newTask, ...prev]);
        showNotification('创建成功', '任务已创建');
        logger.info(`Task created: ${newTask.id}`);
      }
      setModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      logger.error('Failed to save task', err.message);
      showNotification('保存失败', err.message || '无法保存任务', 'error');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const prevTasks = [...tasks];
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    ));

    try {
      logger.info(`Update task status: ${taskId} -> ${newStatus}`);
      const updated = await api.updateTaskStatus(taskId, newStatus);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (err) {
      logger.error('Failed to update task status', err.message);
      setTasks(prevTasks);
      showNotification('更新失败', '无法更新任务状态', 'error');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">📋 团队任务看板</h1>
        <div className="app-header-actions">
          <div className="view-toggle">
            <button
              className={view === 'kanban' ? 'active' : ''}
              onClick={() => setView('kanban')}
            >
              看板视图
            </button>
            <button
              className={view === 'list' ? 'active' : ''}
              onClick={() => setView('list')}
            >
              列表视图
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleCreateTask}>
            + 新建任务
          </button>
        </div>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : view === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onUpdateStatus={handleUpdateStatus}
          />
        ) : (
          <TaskList
            tasks={tasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </main>

      <HealthStatus />

      <TaskModal
        isOpen={modalOpen}
        task={editingTask}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmitTask}
      />

      <Notification
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}

export default App;
