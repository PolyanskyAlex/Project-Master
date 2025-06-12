import apiClient from './api';
import { Comment, CreateCommentRequest, ApiResponse } from '../types/api';

export const commentService = {
  // Получить комментарии по ID задачи
  async getByTaskId(taskId: string): Promise<Comment[]> {
    const response = await apiClient.get<ApiResponse<Comment[]>>(`/comments/task/${taskId}`);
    return response.data.data || [];
  },

  // Создать комментарий
  async create(data: CreateCommentRequest): Promise<Comment> {
    const response = await apiClient.post<ApiResponse<Comment>>('/comments', data);
    if (!response.data.data) {
      throw new Error(response.data.error || 'Ошибка создания комментария');
    }
    return response.data.data;
  },
}; 