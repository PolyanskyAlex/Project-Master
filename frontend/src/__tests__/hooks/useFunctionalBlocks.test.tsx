import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFunctionalBlocks } from '../../hooks/useFunctionalBlocks';
import { server } from '../utils/msw-setup';
import { mockApiError } from '../utils/api-mocks';
import { NotificationProvider } from '../../contexts/NotificationContext';

// Wrapper для провайдеров
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>{children}</NotificationProvider>
);

describe('useFunctionalBlocks', () => {
  it('loads functional blocks on mount', async () => {
    const { result } = renderHook(() => useFunctionalBlocks(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.functionalBlocks).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.functionalBlocks.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('handles loading error', async () => {
    server.use(mockApiError('/api/v1/functional-blocks', 500, 'Server error'));

    const { result } = renderHook(() => useFunctionalBlocks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.functionalBlocks).toEqual([]);
  });

  it('creates functional block successfully', async () => {
    const { result } = renderHook(() => useFunctionalBlocks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newBlock = {
      name: 'Test Block',
      prefix: 'TB',
      description: 'Test description'
    };

    await act(async () => {
      await result.current.createFunctionalBlock(newBlock);
    });

    expect(result.current.functionalBlocks.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('handles create error', async () => {
    server.use(mockApiError('/api/v1/functional-blocks', 400, 'Validation error'));

    const { result } = renderHook(() => useFunctionalBlocks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newBlock = {
      name: '',
      prefix: '',
      description: ''
    };

    await act(async () => {
      try {
        await result.current.createFunctionalBlock(newBlock);
      } catch (error) {
        // Ожидаем ошибку
      }
    });

    expect(result.current.error).toBeTruthy();
  });

  it('updates functional block successfully', async () => {
    const { result } = renderHook(() => useFunctionalBlocks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updateData = {
      name: 'Updated Block',
      prefix: 'UB',
      description: 'Updated description'
    };

    await act(async () => {
      await result.current.updateFunctionalBlock('1', updateData);
    });

    expect(result.current.error).toBeNull();
  });

  it('handles update error', async () => {
    server.use(mockApiError('/api/v1/functional-blocks/999', 404, 'Not found'));

    const { result } = renderHook(() => useFunctionalBlocks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updateData = { name: 'Updated' };

    await act(async () => {
      try {
        await result.current.updateFunctionalBlock('999', updateData);
      } catch (error) {
        // Ожидаем ошибку
      }
    });

    expect(result.current.error).toBeTruthy();
  });

  it('deletes functional block successfully', async () => {
    const { result } = renderHook(() => useFunctionalBlocks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCount = result.current.functionalBlocks.length;

    await act(async () => {
      await result.current.deleteFunctionalBlock('1');
    });

    expect(result.current.error).toBeNull();
    // После удаления список должен обновиться
  });

  it('handles delete error', async () => {
    server.use(mockApiError('/api/v1/functional-blocks/999', 404, 'Not found'));

    const { result } = renderHook(() => useFunctionalBlocks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.deleteFunctionalBlock('999');
      } catch (error) {
        // Ожидаем ошибку
      }
    });

    expect(result.current.error).toBeTruthy();
  });

  it('refreshes data when refreshFunctionalBlocks is called', async () => {
    const { result } = renderHook(() => useFunctionalBlocks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshFunctionalBlocks();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.functionalBlocks.length).toBeGreaterThan(0);
  });

  it('handles concurrent operations correctly', async () => {
    const { result } = renderHook(() => useFunctionalBlocks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newBlock1 = { name: 'Block 1', prefix: 'B1', description: 'Desc 1' };
    const newBlock2 = { name: 'Block 2', prefix: 'B2', description: 'Desc 2' };

    await act(async () => {
      await Promise.all([
        result.current.createFunctionalBlock(newBlock1),
        result.current.createFunctionalBlock(newBlock2)
      ]);
    });

    expect(result.current.error).toBeNull();
  });
}); 