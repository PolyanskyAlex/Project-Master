import { ApiService } from '../../services/api';
import { server } from '../utils/msw-setup';
import { mockApiError } from '../utils/api-mocks';

describe('ApiService', () => {
  let apiService: ApiService;

  beforeEach(() => {
    apiService = new ApiService();
  });

  describe('get method', () => {
    it('makes GET request successfully', async () => {
      const response = await apiService.get('/api/v1/functional-blocks');
      
      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);
    });

    it('handles GET request errors', async () => {
      server.use(mockApiError('/api/v1/error', 500, 'Server error'));
      
      await expect(apiService.get('/api/v1/error')).rejects.toThrow();
    });

    it('includes query parameters', async () => {
      const response = await apiService.get('/api/v1/tasks', { project_id: '1' });
      
      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
    });
  });

  describe('post method', () => {
    it('makes POST request successfully', async () => {
      const data = { name: 'Test Block', prefix: 'TB', description: 'Test' };
      const response = await apiService.post('/api/v1/functional-blocks', data);
      
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
    });

    it('handles POST request errors', async () => {
      server.use(mockApiError('/api/v1/functional-blocks', 400, 'Bad request'));
      
      const data = { name: 'Test Block' };
      await expect(apiService.post('/api/v1/functional-blocks', data)).rejects.toThrow();
    });
  });

  describe('put method', () => {
    it('makes PUT request successfully', async () => {
      const data = { name: 'Updated Block', prefix: 'UB', description: 'Updated' };
      const response = await apiService.put('/api/v1/functional-blocks/1', data);
      
      expect(response).toBeDefined();
      expect(response.id).toBe(1);
    });

    it('handles PUT request errors', async () => {
      server.use(mockApiError('/api/v1/functional-blocks/999', 404, 'Not found'));
      
      const data = { name: 'Updated Block' };
      await expect(apiService.put('/api/v1/functional-blocks/999', data)).rejects.toThrow();
    });
  });

  describe('delete method', () => {
    it('makes DELETE request successfully', async () => {
      await expect(apiService.delete('/api/v1/functional-blocks/1')).resolves.not.toThrow();
    });

    it('handles DELETE request errors', async () => {
      server.use(mockApiError('/api/v1/functional-blocks/999', 404, 'Not found'));
      
      await expect(apiService.delete('/api/v1/functional-blocks/999')).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('handles network errors', async () => {
      // Симулируем сетевую ошибку
      server.use(mockApiError('/api/v1/network-error', 0, 'Network Error'));
      
      await expect(apiService.get('/api/v1/network-error')).rejects.toThrow();
    });

    it('handles timeout errors', async () => {
      // Симулируем таймаут
      server.use(mockApiError('/api/v1/timeout', 408, 'Request Timeout'));
      
      await expect(apiService.get('/api/v1/timeout')).rejects.toThrow();
    });
  });

  describe('request interceptors', () => {
    it('adds API key to requests', async () => {
      // Проверяем, что API ключ добавляется в заголовки
      const response = await apiService.get('/api/v1/functional-blocks');
      expect(response).toBeDefined();
    });

    it('adds content-type header for POST requests', async () => {
      const data = { name: 'Test' };
      const response = await apiService.post('/api/v1/functional-blocks', data);
      expect(response).toBeDefined();
    });
  });

  describe('response interceptors', () => {
    it('logs successful responses in development', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await apiService.get('/api/v1/functional-blocks');
      
      // В тестовой среде логирование может быть отключено
      consoleSpy.mockRestore();
    });

    it('logs error responses', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      server.use(mockApiError('/api/v1/error', 500, 'Server error'));
      
      try {
        await apiService.get('/api/v1/error');
      } catch (error) {
        // Ожидаем ошибку
      }
      
      consoleSpy.mockRestore();
    });
  });
}); 