import { useState, useEffect, useCallback } from 'react';
import { operationLogService } from '../services/operationLogService';
import {
  OperationLog,
  ApiError,
} from '../types/api';

interface UseOperationLogsReturn {
  logs: OperationLog[];
  loading: boolean;
  error: string | null;
  refreshLogs: () => Promise<void>;
}

export const useOperationLogs = (taskId?: string): UseOperationLogsReturn => {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data: OperationLog[];
      
      if (taskId) {
        data = await operationLogService.getByTaskId(taskId);
      } else {
        data = await operationLogService.getAll();
      }
      
      setLogs(data);
    } catch (err: any) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Ошибка загрузки логов операций');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const refreshLogs = useCallback(async () => {
    await loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return {
    logs,
    loading,
    error,
    refreshLogs,
  };
}; 