import { ApiService } from './api';
import {
  FunctionalBlock,
  CreateFunctionalBlockRequest,
  UpdateFunctionalBlockRequest,
} from '../types/api';

export class FunctionalBlockService extends ApiService {
  private readonly baseUrl = '/api/v1/functional-blocks';

  // Получить все функциональные блоки
  async getAll(): Promise<FunctionalBlock[]> {
    return this.get<FunctionalBlock[]>(this.baseUrl);
  }

  // Получить функциональный блок по ID
  async getById(id: string): Promise<FunctionalBlock> {
    return this.get<FunctionalBlock>(`${this.baseUrl}/${id}`);
  }

  // Создать функциональный блок
  async create(data: CreateFunctionalBlockRequest): Promise<FunctionalBlock> {
    return this.post<FunctionalBlock>(this.baseUrl, data);
  }

  // Обновить функциональный блок
  async update(id: string, data: UpdateFunctionalBlockRequest): Promise<FunctionalBlock> {
    return this.put<FunctionalBlock>(`${this.baseUrl}/${id}`, data);
  }

  // Удалить функциональный блок
  async deleteById(id: string): Promise<{ message: string }> {
    return this.delete(`${this.baseUrl}/${id}`);
  }
}

export const functionalBlockService = new FunctionalBlockService(); 