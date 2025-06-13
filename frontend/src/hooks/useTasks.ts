import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  ApiError,
  FilterParams,
} from '../types/api';
import { logger } from '../utils/logger';
import { useNotification } from '../contexts/NotificationContext';
import { usePerformanceTimer } from './usePerformanceMonitor';

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (data: CreateTaskRequest) => Promise<Task | null>;
  updateTask: (id: string, data: UpdateTaskRequest) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  refreshTasks: () => Promise<void>;
  filterTasks: (filters: FilterParams) => Promise<void>;
}

export const useTasks = (initialFilters?: FilterParams): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<FilterParams>(initialFilters || {});
  
  const { showSuccess, showError } = useNotification();
  const { measureAsyncFunction } = usePerformanceTimer();

  const loadTasks = useCallback(async (filters: FilterParams = {}) => {
    const measuredLoadTasks = measureAsyncFunction(
      async (filters: FilterParams) => {
        setLoading(true);
        setError(null);
        logger.info('Loading tasks', { filters }, 'Tasks');
        const data = await taskService.getAll(filters);
        const tasksArray = Array.isArray(data) ? data : [];
        logger.info(`Loaded ${tasksArray.length} tasks`, { count: tasksArray.length }, 'Tasks');
        setTasks(tasksArray);
      },
      'loadTasks'
    );

    try {
      await measuredLoadTasks(filters);
    } catch (err: any) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Ошибка загрузки задач';
      setError(errorMessage);
      showError(errorMessage);
      logger.error('Failed to load tasks', { error: apiError, filters }, 'Tasks');
    } finally {
      setLoading(false);
    }
  }, [measureAsyncFunction, showError]);

  const createTask = useCallback(async (data: CreateTaskRequest): Promise<Task | null> => {
    try {
      setError(null);
      logger.info('Creating task', { title: data.title, projectId: data.projectId }, 'Tasks');
      const newTask = await taskService.create(data);
      setTasks(prev => [...prev, newTask]);
      showSuccess(`Задача "${newTask.title}" успешно создана`);
      logger.info('Task created successfully', { taskId: newTask.id, title: newTask.title }, 'Tasks');
      return newTask;
    } catch (err: any) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Ошибка создания задачи';
      setError(errorMessage);
      showError(errorMessage);
      logger.error('Failed to create task', { error: apiError, data }, 'Tasks');
      return null;
    }
  }, [showSuccess, showError]);

  const updateTask = useCallback(async (id: string, data: UpdateTaskRequest): Promise<Task | null> => {
    try {
      setError(null);
      const updatedTask = await taskService.update(id, data);
      setTasks(prev => 
        prev.map(task => task.id === id ? updatedTask : task)
      );
      return updatedTask;
    } catch (err: any) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Ошибка обновления задачи');
      return null;
    }
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await taskService.deleteById(id);
      setTasks(prev => prev.filter(task => task.id !== id));
      return true;
    } catch (err: any) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Ошибка удаления задачи');
      return false;
    }
  }, []);

  const filterTasks = useCallback(async (filters: FilterParams) => {
    setCurrentFilters(filters);
    await loadTasks(filters);
  }, [loadTasks]);

  const refreshTasks = useCallback(async () => {
    await loadTasks(currentFilters);
  }, [loadTasks, currentFilters]);

  useEffect(() => {
    loadTasks(currentFilters);
  }, [loadTasks, currentFilters]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks,
    filterTasks,
  };
}; 