import { useState, useEffect, useCallback } from 'react';
import { commentService } from '../services/commentService';
import {
  Comment,
  CreateCommentRequest,
  ApiError,
} from '../types/api';

interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  createComment: (data: CreateCommentRequest) => Promise<Comment | null>;
  refreshComments: () => Promise<void>;
}

export const useComments = (taskId: string): UseCommentsReturn => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!taskId) {
      setComments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await commentService.getByTaskId(taskId);
      const commentsArray = Array.isArray(data) ? data : [];
      setComments(commentsArray);
    } catch (err: any) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Ошибка загрузки комментариев');
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const createComment = useCallback(async (data: CreateCommentRequest): Promise<Comment | null> => {
    try {
      setError(null);
      const newComment = await commentService.create(data);
      setComments(prev => [...prev, newComment]);
      return newComment;
    } catch (err: any) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Ошибка создания комментария');
      return null;
    }
  }, []);

  const refreshComments = useCallback(async () => {
    await loadComments();
  }, [loadComments]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return {
    comments,
    loading,
    error,
    createComment,
    refreshComments,
  };
}; 