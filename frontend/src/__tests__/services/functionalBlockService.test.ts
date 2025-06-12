import { functionalBlockService } from '../../services/functionalBlockService';
import { server } from '../utils/msw-setup';
import { mockApiError } from '../utils/api-mocks';
import { createMockData } from '../utils/test-utils';

describe('FunctionalBlockService', () => {
  describe('getAll', () => {
    it('fetches all functional blocks successfully', async () => {
      const blocks = await functionalBlockService.getAll();
      
      expect(Array.isArray(blocks)).toBe(true);
      expect(blocks.length).toBeGreaterThan(0);
      expect(blocks[0]).toHaveProperty('id');
      expect(blocks[0]).toHaveProperty('name');
      expect(blocks[0]).toHaveProperty('prefix');
    });

    it('handles API errors', async () => {
      server.use(mockApiError('/api/v1/functional-blocks', 500, 'Server error'));
      
      await expect(functionalBlockService.getAll()).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('fetches functional block by id successfully', async () => {
      const block = await functionalBlockService.getById('1');
      
      expect(block).toBeDefined();
      expect(block.id).toBe(1);
      expect(block).toHaveProperty('name');
      expect(block).toHaveProperty('prefix');
    });

    it('handles not found error', async () => {
      server.use(mockApiError('/api/v1/functional-blocks/999', 404, 'Not found'));
      
      await expect(functionalBlockService.getById('999')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates functional block successfully', async () => {
      const newBlock = {
        name: 'Test Block',
        prefix: 'TB',
        description: 'Test description'
      };
      
      const createdBlock = await functionalBlockService.create(newBlock);
      
      expect(createdBlock).toBeDefined();
      expect(createdBlock.id).toBeDefined();
      expect(createdBlock.name).toBe(newBlock.name);
      expect(createdBlock.prefix).toBe(newBlock.prefix);
    });

    it('handles validation errors', async () => {
      server.use(mockApiError('/api/v1/functional-blocks', 400, 'Validation error'));
      
      const invalidBlock = { name: '' }; // Invalid data
      
      await expect(functionalBlockService.create(invalidBlock as any)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates functional block successfully', async () => {
      const updateData = {
        name: 'Updated Block',
        prefix: 'UB',
        description: 'Updated description'
      };
      
      const updatedBlock = await functionalBlockService.update('1', updateData);
      
      expect(updatedBlock).toBeDefined();
      expect(updatedBlock.id).toBe(1);
    });

    it('handles not found error on update', async () => {
      server.use(mockApiError('/api/v1/functional-blocks/999', 404, 'Not found'));
      
      const updateData = { name: 'Updated' };
      
      await expect(functionalBlockService.update('999', updateData)).rejects.toThrow();
    });
  });

  describe('deleteById', () => {
    it('deletes functional block successfully', async () => {
      await expect(functionalBlockService.deleteById('1')).resolves.not.toThrow();
    });

    it('handles not found error on delete', async () => {
      server.use(mockApiError('/api/v1/functional-blocks/999', 404, 'Not found'));
      
      await expect(functionalBlockService.deleteById('999')).rejects.toThrow();
    });

    it('handles constraint violation error', async () => {
      server.use(mockApiError('/api/v1/functional-blocks/1', 409, 'Constraint violation'));
      
      await expect(functionalBlockService.deleteById('1')).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('handles network errors gracefully', async () => {
      server.use(mockApiError('/api/v1/functional-blocks', 0, 'Network Error'));
      
      await expect(functionalBlockService.getAll()).rejects.toThrow();
    });

    it('handles timeout errors', async () => {
      server.use(mockApiError('/api/v1/functional-blocks', 408, 'Request Timeout'));
      
      await expect(functionalBlockService.getAll()).rejects.toThrow();
    });
  });
}); 