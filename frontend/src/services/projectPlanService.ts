import { ApiService } from './api';
import { 
  ProjectPlan, 
  ProjectPlanStats, 
  ReorderRequest, 
  MoveTaskRequest, 
  BatchTaskRequest 
} from '../types/api';

export class ProjectPlanService extends ApiService {
  private basePath = '/projects';

  async getProjectPlan(projectId: string): Promise<ProjectPlan> {
    return await this.get<ProjectPlan>(`${this.basePath}/${projectId}/plan`);
  }

  async getProjectPlanStats(projectId: string): Promise<ProjectPlanStats> {
    return await this.get<ProjectPlanStats>(`${this.basePath}/${projectId}/plan/stats`);
  }

  async addTaskToPlan(projectId: string, taskId: string): Promise<void> {
    await this.post(`${this.basePath}/${projectId}/plan/tasks/${taskId}`);
  }

  async removeTaskFromPlan(projectId: string, taskId: string): Promise<void> {
    await this.delete(`${this.basePath}/${projectId}/plan/tasks/${taskId}`);
  }

  async reorderTasks(projectId: string, reorderRequest: ReorderRequest): Promise<void> {
    await this.put(`${this.basePath}/${projectId}/plan/reorder`, reorderRequest);
  }

  async moveTaskToPosition(projectId: string, taskId: string, position: number): Promise<void> {
    const request: MoveTaskRequest = { position };
    await this.put(`${this.basePath}/${projectId}/plan/tasks/${taskId}/position`, request);
  }

  async getTaskPosition(projectId: string, taskId: string): Promise<{ task_id: string; position: number }> {
    return await this.get(`${this.basePath}/${projectId}/plan/tasks/${taskId}/position`);
  }

  async isTaskInPlan(projectId: string, taskId: string): Promise<{ task_id: string; in_plan: boolean }> {
    return await this.get(`${this.basePath}/${projectId}/plan/tasks/${taskId}/check`);
  }

  async addMultipleTasksToPlan(projectId: string, taskIds: string[]): Promise<{
    total_tasks: number;
    success_count: number;
    failed_count: number;
    errors?: string[];
  }> {
    const request: BatchTaskRequest = { task_ids: taskIds };
    return await this.post(`${this.basePath}/${projectId}/plan/tasks/batch`, request);
  }

  async removeMultipleTasksFromPlan(projectId: string, taskIds: string[]): Promise<{
    total_tasks: number;
    success_count: number;
    failed_count: number;
    errors?: string[];
  }> {
    const request: BatchTaskRequest = { task_ids: taskIds };
    const response = await this.client.delete(`${this.basePath}/${projectId}/plan/tasks/batch`, { data: request });
    return response.data;
  }
}

export const projectPlanService = new ProjectPlanService(); 