import { ApiService } from './api';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectPlan,
  ProjectPlanStats,
  ReorderRequest,
  MoveTaskRequest,
  BatchTaskRequest,
} from '../types/api';

export class ProjectService extends ApiService {
  private readonly baseUrl = '/api/v1/projects';

  // Получить все проекты
  async getAll(): Promise<Project[]> {
    return this.get<Project[]>(this.baseUrl);
  }

  // Получить проект по ID
  async getById(id: string): Promise<Project> {
    return this.get<Project>(`${this.baseUrl}/${id}`);
  }

  // Создать проект
  async create(data: CreateProjectRequest): Promise<Project> {
    return this.post<Project>(this.baseUrl, data);
  }

  // Обновить проект
  async update(id: string, data: UpdateProjectRequest): Promise<Project> {
    return this.put<Project>(`${this.baseUrl}/${id}`, data);
  }

  // Удалить проект
  async deleteById(id: string): Promise<{ message: string }> {
    return this.delete(`${this.baseUrl}/${id}`);
  }

  // Методы для работы с планом разработки

  // Получить план проекта
  async getProjectPlan(projectId: string): Promise<ProjectPlan> {
    return this.get<ProjectPlan>(`${this.baseUrl}/${projectId}/plan`);
  }

  // Получить статистику плана проекта
  async getProjectPlanStats(projectId: string): Promise<ProjectPlanStats> {
    return this.get<ProjectPlanStats>(`${this.baseUrl}/${projectId}/plan/stats`);
  }

  // Изменить порядок задач в плане
  async reorderTasks(projectId: string, data: ReorderRequest): Promise<{ message: string }> {
    return this.put(`${this.baseUrl}/${projectId}/plan/reorder`, data);
  }

  // Добавить задачу в план
  async addTaskToPlan(projectId: string, taskId: string): Promise<{ message: string }> {
    return this.post(`${this.baseUrl}/${projectId}/plan/tasks/${taskId}`);
  }

  // Удалить задачу из плана
  async removeTaskFromPlan(projectId: string, taskId: string): Promise<{ message: string }> {
    return this.delete(`${this.baseUrl}/${projectId}/plan/tasks/${taskId}`);
  }

  // Проверить, находится ли задача в плане
  async isTaskInPlan(projectId: string, taskId: string): Promise<{ task_id: string; in_plan: boolean }> {
    return this.get(`${this.baseUrl}/${projectId}/plan/tasks/${taskId}/check`);
  }

  // Получить позицию задачи в плане
  async getTaskPosition(projectId: string, taskId: string): Promise<{ task_id: string; position: number }> {
    return this.get(`${this.baseUrl}/${projectId}/plan/tasks/${taskId}/position`);
  }

  // Переместить задачу на определенную позицию
  async moveTaskToPosition(projectId: string, taskId: string, data: MoveTaskRequest): Promise<{ message: string }> {
    return this.put(`${this.baseUrl}/${projectId}/plan/tasks/${taskId}/position`, data);
  }

  // Добавить несколько задач в план
  async addMultipleTasksToPlan(projectId: string, data: BatchTaskRequest): Promise<any> {
    return this.post(`${this.baseUrl}/${projectId}/plan/tasks/batch`, data);
  }

  // Удалить несколько задач из плана
  async removeMultipleTasksFromPlan(projectId: string, data: BatchTaskRequest): Promise<any> {
    return this.delete(`${this.baseUrl}/${projectId}/plan/tasks/batch`);
  }
}

export const projectService = new ProjectService(); 