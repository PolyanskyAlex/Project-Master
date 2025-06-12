import { useState, useCallback } from 'react';
import { projectPlanService } from '../services/projectPlanService';
import { ProjectPlan, ProjectPlanItem, ProjectPlanStats, ReorderRequest } from '../types/api';

export const useProjectPlan = (projectId?: string) => {
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [stats, setStats] = useState<ProjectPlanStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectPlan = useCallback(async (id?: string) => {
    const targetProjectId = id || projectId;
    if (!targetProjectId) return;

    setLoading(true);
    setError(null);
    try {
      const planData = await projectPlanService.getProjectPlan(targetProjectId);
      setPlan(planData);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке плана разработки');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchProjectPlanStats = useCallback(async (id?: string) => {
    const targetProjectId = id || projectId;
    if (!targetProjectId) return;

    setLoading(true);
    setError(null);
    try {
      const statsData = await projectPlanService.getProjectPlanStats(targetProjectId);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке статистики плана');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const addTaskToPlan = useCallback(async (taskId: string, id?: string): Promise<void> => {
    const targetProjectId = id || projectId;
    if (!targetProjectId) throw new Error('Project ID is required');

    setLoading(true);
    setError(null);
    try {
      await projectPlanService.addTaskToPlan(targetProjectId, taskId);
      // Обновляем план после добавления
      await fetchProjectPlan(targetProjectId);
    } catch (err: any) {
      setError(err.message || 'Ошибка при добавлении задачи в план');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchProjectPlan]);

  const removeTaskFromPlan = useCallback(async (taskId: string, id?: string): Promise<void> => {
    const targetProjectId = id || projectId;
    if (!targetProjectId) throw new Error('Project ID is required');

    setLoading(true);
    setError(null);
    try {
      await projectPlanService.removeTaskFromPlan(targetProjectId, taskId);
      // Обновляем план после удаления
      await fetchProjectPlan(targetProjectId);
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении задачи из плана');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchProjectPlan]);

  const reorderTasks = useCallback(async (reorderRequest: ReorderRequest, id?: string): Promise<void> => {
    const targetProjectId = id || projectId;
    if (!targetProjectId) throw new Error('Project ID is required');

    setLoading(true);
    setError(null);
    try {
      await projectPlanService.reorderTasks(targetProjectId, reorderRequest);
      // Обновляем план после изменения порядка
      await fetchProjectPlan(targetProjectId);
    } catch (err: any) {
      setError(err.message || 'Ошибка при изменении порядка задач');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchProjectPlan]);

  const moveTaskToPosition = useCallback(async (taskId: string, position: number, id?: string): Promise<void> => {
    const targetProjectId = id || projectId;
    if (!targetProjectId) throw new Error('Project ID is required');

    setLoading(true);
    setError(null);
    try {
      await projectPlanService.moveTaskToPosition(targetProjectId, taskId, position);
      // Обновляем план после перемещения
      await fetchProjectPlan(targetProjectId);
    } catch (err: any) {
      setError(err.message || 'Ошибка при перемещении задачи');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchProjectPlan]);

  const addMultipleTasksToPlan = useCallback(async (taskIds: string[], id?: string) => {
    const targetProjectId = id || projectId;
    if (!targetProjectId) throw new Error('Project ID is required');

    setLoading(true);
    setError(null);
    try {
      const result = await projectPlanService.addMultipleTasksToPlan(targetProjectId, taskIds);
      // Обновляем план после добавления
      await fetchProjectPlan(targetProjectId);
      return result;
    } catch (err: any) {
      setError(err.message || 'Ошибка при добавлении задач в план');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchProjectPlan]);

  const removeMultipleTasksFromPlan = useCallback(async (taskIds: string[], id?: string) => {
    const targetProjectId = id || projectId;
    if (!targetProjectId) throw new Error('Project ID is required');

    setLoading(true);
    setError(null);
    try {
      const result = await projectPlanService.removeMultipleTasksFromPlan(targetProjectId, taskIds);
      // Обновляем план после удаления
      await fetchProjectPlan(targetProjectId);
      return result;
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении задач из плана');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchProjectPlan]);

  const isTaskInPlan = useCallback(async (taskId: string, id?: string) => {
    const targetProjectId = id || projectId;
    if (!targetProjectId) throw new Error('Project ID is required');

    try {
      const result = await projectPlanService.isTaskInPlan(targetProjectId, taskId);
      return result.in_plan;
    } catch (err: any) {
      console.error('Ошибка при проверке задачи в плане:', err);
      return false;
    }
  }, [projectId]);

  const getTaskPosition = useCallback(async (taskId: string, id?: string) => {
    const targetProjectId = id || projectId;
    if (!targetProjectId) throw new Error('Project ID is required');

    try {
      const result = await projectPlanService.getTaskPosition(targetProjectId, taskId);
      return result.position;
    } catch (err: any) {
      console.error('Ошибка при получении позиции задачи:', err);
      return -1;
    }
  }, [projectId]);

  // Локальное обновление порядка для drag-and-drop (без API вызова)
  const updateLocalOrder = useCallback((newItems: ProjectPlanItem[]) => {
    if (plan) {
      setPlan({
        ...plan,
        items: newItems
      });
    }
  }, [plan]);

  return {
    plan,
    stats,
    loading,
    error,
    fetchProjectPlan,
    fetchProjectPlanStats,
    addTaskToPlan,
    removeTaskFromPlan,
    reorderTasks,
    moveTaskToPosition,
    addMultipleTasksToPlan,
    removeMultipleTasksFromPlan,
    isTaskInPlan,
    getTaskPosition,
    updateLocalOrder,
    setError
  };
}; 