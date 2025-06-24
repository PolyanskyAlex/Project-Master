import { apiClient } from './apiClient';

export interface ExecuteTaskRequest {
  command: string;
  source: string;
  user_id: string;
  project_id?: number;
}

export interface ExecuteTaskResponse {
  execution_id: string;
  status: string;
  message: string;
}

export interface ExecutionStatus {
  id: string;
  status: string;
  progress: number;
  message: string;
  task_id?: number;
  task_title: string;
  strategy: string;
  start_time: string;
  end_time?: string;
  execution_time?: number;
  error?: string;
  steps: ExecutionStep[];
  logs: string[];
  result?: any;
}

export interface ExecutionStep {
  id: string;
  name: string;
  status: string;
  start_time: string;
  end_time?: string;
  error?: string;
  description: string;
}

export interface ExecutionHistory {
  executions: ExecutionStatus[];
  total: number;
  limit: number;
  offset: number;
}

export interface ExecutionMetrics {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_execution_time: number;
  strategies_used: Record<string, number>;
  common_errors: Record<string, number>;
}

export interface TaskExecuteButtonConfig {
  task_id: number;
  task_title: string;
  can_execute: boolean;
  execution_command: string;
  active_executions: number;
  button_config: {
    enabled: boolean;
    text: string;
    variant: string;
    icon: string;
    tooltip: string;
  };
}

class TaskExecutionApi {
  /**
   * Запустить выполнение задачи
   */
  async executeTask(request: ExecuteTaskRequest): Promise<ExecuteTaskResponse> {
    const response = await apiClient.post('/api/v1/tasks/execute', request);
    return response.data;
  }

  /**
   * Получить статус выполнения задачи
   */
  async getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
    const response = await apiClient.get(`/api/v1/tasks/execute/${executionId}/status`);
    return response.data;
  }

  /**
   * Отменить выполнение задачи
   */
  async cancelExecution(executionId: string): Promise<void> {
    await apiClient.post(`/api/v1/tasks/execute/${executionId}/cancel`);
  }

  /**
   * Получить историю выполнений
   */
  async getExecutionHistory(params?: {
    user_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<ExecutionHistory> {
    const response = await apiClient.get('/api/v1/tasks/execute/history', { params });
    return response.data;
  }

  /**
   * Получить метрики выполнения
   */
  async getExecutionMetrics(params?: {
    user_id?: string;
    days?: number;
  }): Promise<ExecutionMetrics> {
    const response = await apiClient.get('/api/v1/tasks/execute/metrics', { params });
    return response.data;
  }

  /**
   * Получить конфигурацию кнопки выполнения для задачи
   */
  async getTaskExecuteButton(taskId: number): Promise<TaskExecuteButtonConfig> {
    const response = await apiClient.get(`/api/v1/tasks/${taskId}/execute-button`);
    return response.data;
  }

  /**
   * Создать WebSocket соединение для real-time обновлений
   */
  createExecutionWebSocket(executionId: string): WebSocket {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';
    const ws = new WebSocket(`${wsUrl}/api/v1/tasks/execute/${executionId}/ws`);
    
    ws.onopen = () => {
      console.log('WebSocket connection opened for execution:', executionId);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed for execution:', executionId);
    };
    
    return ws;
  }

  /**
   * Подписаться на обновления статуса выполнения через WebSocket
   */
  subscribeToExecutionUpdates(
    executionId: string,
    onStatusUpdate: (status: ExecutionStatus) => void,
    onError?: (error: any) => void
  ): () => void {
    const ws = this.createExecutionWebSocket(executionId);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'status_update') {
          onStatusUpdate(data.payload);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        onError?.(error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };
    
    // Возвращаем функцию для отписки
    return () => {
      ws.close();
    };
  }

  /**
   * Опрос статуса выполнения с заданным интервалом
   */
  pollExecutionStatus(
    executionId: string,
    onStatusUpdate: (status: ExecutionStatus) => void,
    onComplete: (status: ExecutionStatus) => void,
    onError?: (error: any) => void,
    intervalMs: number = 2000
  ): () => void {
    const intervalId = setInterval(async () => {
      try {
        const status = await this.getExecutionStatus(executionId);
        onStatusUpdate(status);
        
        // Проверяем, завершилось ли выполнение
        if (['completed', 'failed', 'cancelled'].includes(status.status)) {
          clearInterval(intervalId);
          onComplete(status);
        }
      } catch (error) {
        console.error('Failed to poll execution status:', error);
        onError?.(error);
        clearInterval(intervalId);
      }
    }, intervalMs);
    
    // Возвращаем функцию для остановки опроса
    return () => {
      clearInterval(intervalId);
    };
  }

  /**
   * Получить активные выполнения для пользователя
   */
  async getActiveExecutions(userId?: string): Promise<ExecutionStatus[]> {
    const response = await this.getExecutionHistory({
      user_id: userId,
      limit: 50
    });
    
    return response.executions.filter(execution => 
      ['pending', 'searching', 'analyzing', 'executing'].includes(execution.status)
    );
  }

  /**
   * Массовая отмена выполнений
   */
  async cancelMultipleExecutions(executionIds: string[]): Promise<{
    cancelled: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const results = await Promise.allSettled(
      executionIds.map(id => this.cancelExecution(id).then(() => id))
    );
    
    const cancelled: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        cancelled.push(result.value);
      } else {
        failed.push({
          id: executionIds[index],
          error: result.reason?.message || 'Unknown error'
        });
      }
    });
    
    return { cancelled, failed };
  }
}

export const taskExecutionApi = new TaskExecutionApi(); 