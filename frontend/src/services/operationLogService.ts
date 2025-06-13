import apiClient from './api';
import { OperationLog, ApiResponse } from '../types/api';

export const operationLogService = {
  // Получить все логи операций
  async getAll(): Promise<OperationLog[]> {
    const response = await apiClient.get<ApiResponse<OperationLog[]>>('/api/v1/operation-logs');
    return response.data.data || [];
  },

  // Получить логи операций по ID задачи
  async getByTaskId(taskId: string): Promise<OperationLog[]> {
    const response = await apiClient.get<ApiResponse<OperationLog[]>>(`/api/v1/operation-logs/task/${taskId}`);
    return response.data.data || [];
  },
}; 