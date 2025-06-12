import { ApiService } from './api';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus,
  TaskPriority,
  TaskType,
  FilterParams,
} from '../types/api';

export class TaskService extends ApiService {
  private readonly baseUrl = '/api/v1/tasks';

  // Получить все задачи
  async getAll(params?: FilterParams): Promise<Task[]> {
    return this.get<Task[]>(this.baseUrl, params);
  }

  // Получить задачу по ID
  async getById(id: string): Promise<Task> {
    return this.get<Task>(`${this.baseUrl}/${id}`);
  }

  // Получить задачу по номеру
  async getByNumber(number: string): Promise<Task> {
    return this.get<Task>(`${this.baseUrl}/number/${number}`);
  }

  // Создать задачу
  async create(data: CreateTaskRequest): Promise<Task> {
    return this.post<Task>(this.baseUrl, data);
  }

  // Обновить задачу
  async update(id: string, data: UpdateTaskRequest): Promise<Task> {
    return this.put<Task>(`${this.baseUrl}/${id}`, data);
  }

  // Удалить задачу
  async deleteById(id: string): Promise<{ message: string }> {
    return this.delete(`${this.baseUrl}/${id}`);
  }

  // Получить задачи по статусу
  async getByStatus(status: TaskStatus): Promise<Task[]> {
    return this.get<Task[]>(`${this.baseUrl}/by-status`, { status });
  }

  // Получить задачи по проекту
  async getByProject(projectId: string): Promise<Task[]> {
    return this.get<Task[]>(`${this.baseUrl}/project/${projectId}`);
  }

  // Получить задачи по функциональному блоку
  async getByFunctionalBlock(functionalBlockId: string): Promise<Task[]> {
    return this.get<Task[]>(`${this.baseUrl}/functional-block/${functionalBlockId}`);
  }

  // Получить доступные статусы
  async getValidStatuses(): Promise<TaskStatus[]> {
    return this.get<TaskStatus[]>(`${this.baseUrl}/statuses`);
  }

  // Получить доступные приоритеты
  async getValidPriorities(): Promise<TaskPriority[]> {
    return this.get<TaskPriority[]>(`${this.baseUrl}/priorities`);
  }

  // Получить доступные типы
  async getValidTypes(): Promise<TaskType[]> {
    return this.get<TaskType[]>(`${this.baseUrl}/types`);
  }
}

export const taskService = new TaskService(); 