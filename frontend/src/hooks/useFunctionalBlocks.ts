import { useState, useEffect, useCallback } from 'react';
import { functionalBlockService } from '../services/functionalBlockService';
import {
  FunctionalBlock,
  CreateFunctionalBlockRequest,
  UpdateFunctionalBlockRequest,
  ApiError,
} from '../types/api';

interface UseFunctionalBlocksReturn {
  functionalBlocks: FunctionalBlock[];
  loading: boolean;
  error: string | null;
  createFunctionalBlock: (data: CreateFunctionalBlockRequest) => Promise<FunctionalBlock | null>;
  updateFunctionalBlock: (id: string, data: UpdateFunctionalBlockRequest) => Promise<FunctionalBlock | null>;
  deleteFunctionalBlock: (id: string) => Promise<boolean>;
  refreshFunctionalBlocks: () => Promise<void>;
}

export const useFunctionalBlocks = (): UseFunctionalBlocksReturn => {
  const [functionalBlocks, setFunctionalBlocks] = useState<FunctionalBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFunctionalBlocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
              const data = await functionalBlockService.getAll();
        const blocksArray = Array.isArray(data) ? data : [];
        setFunctionalBlocks(blocksArray);
    } catch (err: any) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Ошибка загрузки функциональных блоков');
      setFunctionalBlocks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createFunctionalBlock = useCallback(async (data: CreateFunctionalBlockRequest): Promise<FunctionalBlock | null> => {
    try {
      setError(null);
      const newBlock = await functionalBlockService.create(data);
      setFunctionalBlocks(prev => [...(prev || []), newBlock]);
      return newBlock;
    } catch (err: any) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Ошибка создания функционального блока');
      return null;
    }
  }, []);

  const updateFunctionalBlock = useCallback(async (id: string, data: UpdateFunctionalBlockRequest): Promise<FunctionalBlock | null> => {
    try {
      setError(null);
      const updatedBlock = await functionalBlockService.update(id, data);
      setFunctionalBlocks(prev => 
        prev.map(block => block.id === id ? updatedBlock : block)
      );
      return updatedBlock;
    } catch (err: any) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Ошибка обновления функционального блока');
      return null;
    }
  }, []);

  const deleteFunctionalBlock = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await functionalBlockService.deleteById(id);
      setFunctionalBlocks(prev => prev.filter(block => block.id !== id));
      return true;
    } catch (err: any) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Ошибка удаления функционального блока');
      return false;
    }
  }, []);

  const refreshFunctionalBlocks = useCallback(async () => {
    await loadFunctionalBlocks();
  }, [loadFunctionalBlocks]);

  useEffect(() => {
    loadFunctionalBlocks();
  }, [loadFunctionalBlocks]);

  return {
    functionalBlocks,
    loading,
    error,
    createFunctionalBlock,
    updateFunctionalBlock,
    deleteFunctionalBlock,
    refreshFunctionalBlocks,
  };
}; 