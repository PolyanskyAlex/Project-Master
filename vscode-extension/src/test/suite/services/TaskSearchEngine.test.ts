import * as assert from 'assert';
import { TaskSearchEngine } from '../../../services/TaskSearchEngine';
import { IApiService } from '../../../interfaces/IApiService';
import { Task } from '../../../types';
import { TaskSearchQuery, SearchOptions } from '../../../types/search';

// Mock ApiService
class MockApiService implements Partial<IApiService> {
  private tasks: Task[] = [
    {
      id: '1',
      title: 'Implement user authentication',
      description: 'Create login and registration functionality',
      status: 'todo',
      priority: 'high',
      type: 'feature',
      project_id: '1',
      assignee: 'john.doe',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
      tags: ['auth', 'security']
    },
    {
      id: '2',
      title: 'Fix database connection issue',
      description: 'Resolve timeout problems with database connections',
      status: 'in_progress',
      priority: 'critical',
      type: 'bug',
      project_id: '1',
      assignee: 'jane.smith',
      created_at: '2024-01-02T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z',
      tags: ['database', 'bug']
    },
    {
      id: '3',
      title: 'Write API documentation',
      description: 'Document all REST API endpoints',
      status: 'done',
      priority: 'medium',
      type: 'documentation',
      project_id: '2',
      assignee: 'bob.wilson',
      created_at: '2024-01-03T10:00:00Z',
      updated_at: '2024-01-03T10:00:00Z',
      tags: ['docs', 'api']
    }
  ];

  async getTasks(): Promise<Task[]> {
    return this.tasks;
  }

  async getTask(id: string): Promise<Task> {
    const task = this.tasks.find(t => t.id === id);
    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }
    return task;
  }
}

suite('TaskSearchEngine Tests', () => {
  let searchEngine: TaskSearchEngine;
  let mockApiService: MockApiService;

  setup(() => {
    mockApiService = new MockApiService();
    searchEngine = new TaskSearchEngine(mockApiService as unknown as IApiService);
  });

  teardown(() => {
    searchEngine.clearCache();
  });

  suite('findById', () => {
    test('should find task by id', async () => {
      const result = await searchEngine.findById(1);
      
      assert.strictEqual(result?.id, 1);
      assert.strictEqual(result?.title, 'Implement user authentication');
      assert.strictEqual(result?.status, 'todo');
    });

    test('should return null for non-existent task', async () => {
      const result = await searchEngine.findById(999);
      assert.strictEqual(result, null);
    });
  });

  suite('findByTitle', () => {
    test('should find tasks by exact title match', async () => {
      const results = await searchEngine.findByTitle('Fix database connection issue');
      
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 2);
      assert.strictEqual(results[0].title, 'Fix database connection issue');
    });

    test('should find tasks by partial title match', async () => {
      const results = await searchEngine.findByTitle('database');
      
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 2);
      assert.strictEqual(results[0].title, 'Fix database connection issue');
    });

    test('should return empty array for no matches', async () => {
      const results = await searchEngine.findByTitle('nonexistent');
      assert.strictEqual(results.length, 0);
    });

    test('should respect maxResults option', async () => {
      const options: SearchOptions = { maxResults: 1 };
      const results = await searchEngine.findByTitle('', options);
      
      assert.strictEqual(results.length, 1);
    });

    test('should sort by relevance by default', async () => {
      const results = await searchEngine.findByTitle('API');
      
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].title, 'Write API documentation');
      assert.ok(results[0].relevanceScore !== undefined);
    });
  });

  suite('findByKeywords', () => {
    test('should find tasks by single keyword', async () => {
      const results = await searchEngine.findByKeywords(['authentication']);
      
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 1);
    });

    test('should find tasks by multiple keywords', async () => {
      const results = await searchEngine.findByKeywords(['database', 'connection']);
      
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 2);
    });

    test('should return empty array for no keyword matches', async () => {
      const results = await searchEngine.findByKeywords(['nonexistent', 'keywords']);
      assert.strictEqual(results.length, 0);
    });

    test('should calculate relevance scores', async () => {
      const results = await searchEngine.findByKeywords(['API']);
      
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].relevanceScore !== undefined);
      assert.ok(results[0].relevanceScore! > 0);
    });
  });

  suite('smartSearch', () => {
    test('should search by query text', async () => {
      const query: TaskSearchQuery = {
        query: 'authentication'
      };
      
      const results = await searchEngine.smartSearch(query);
      
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 1);
    });

    test('should filter by project id', async () => {
      const query: TaskSearchQuery = {
        query: '',
        projectId: 1
      };
      
      const results = await searchEngine.smartSearch(query);
      
      assert.strictEqual(results.length, 2);
      results.forEach(task => {
        assert.strictEqual(task.projectId, 1);
      });
    });

    test('should filter by status', async () => {
      const query: TaskSearchQuery = {
        query: '',
        status: 'done'
      };
      
      const results = await searchEngine.smartSearch(query);
      
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].status, 'done');
    });

    test('should filter by priority', async () => {
      const query: TaskSearchQuery = {
        query: '',
        priority: 'critical'
      };
      
      const results = await searchEngine.smartSearch(query);
      
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].priority, 'critical');
    });

    test('should filter by assignee', async () => {
      const query: TaskSearchQuery = {
        query: '',
        assignedTo: 'john'
      };
      
      const results = await searchEngine.smartSearch(query);
      
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].assignedTo, 'john.doe');
    });

    test('should combine multiple filters', async () => {
      const query: TaskSearchQuery = {
        query: 'database',
        projectId: 1,
        status: 'in_progress'
      };
      
      const results = await searchEngine.smartSearch(query);
      
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 2);
    });

    test('should respect limit', async () => {
      const query: TaskSearchQuery = {
        query: '',
        limit: 2
      };
      
      const results = await searchEngine.smartSearch(query);
      
      assert.strictEqual(results.length, 2);
    });

    test('should return all tasks when no filters applied', async () => {
      const query: TaskSearchQuery = {
        query: ''
      };
      
      const results = await searchEngine.smartSearch(query);
      
      assert.strictEqual(results.length, 3);
    });
  });

  suite('Caching', () => {
    test('should cache search results', async () => {
      // First call
      const results1 = await searchEngine.findByTitle('authentication');
      
      // Second call should return cached results
      const results2 = await searchEngine.findByTitle('authentication');
      
      assert.deepStrictEqual(results1, results2);
    });

    test('should clear cache', async () => {
      await searchEngine.findByTitle('authentication');
      
      // Should not throw
      searchEngine.clearCache();
      
      // Should still work after cache clear
      const results = await searchEngine.findByTitle('authentication');
      assert.strictEqual(results.length, 1);
    });
  });

  suite('Fuzzy Search', () => {
    test('should find tasks with typos', async () => {
      const results = await searchEngine.findByTitle('autentication'); // typo in "authentication"
      
      // Should still find the authentication task due to fuzzy matching
      assert.ok(results.length > 0);
    });

    test('should respect fuzzy threshold', async () => {
      const options: SearchOptions = { fuzzyThreshold: 0.9 };
      const results = await searchEngine.findByTitle('xyz', options);
      
      // Should not find anything with high threshold
      assert.strictEqual(results.length, 0);
    });
  });

  suite('Sorting', () => {
    test('should sort by relevance by default', async () => {
      const query: TaskSearchQuery = { query: 'API' };
      const results = await searchEngine.smartSearch(query);
      
      // Should be sorted by relevance (highest first)
      for (let i = 0; i < results.length - 1; i++) {
        const current = results[i].relevanceScore || 0;
        const next = results[i + 1].relevanceScore || 0;
        assert.ok(current >= next);
      }
    });

    test('should sort by date when specified', async () => {
      const query: TaskSearchQuery = { query: '' };
      const options: SearchOptions = { sortBy: 'date' };
      const results = await searchEngine.smartSearch(query, options);
      
      // Should be sorted by date (newest first)
      for (let i = 0; i < results.length - 1; i++) {
        const currentDate = new Date(results[i].updatedAt);
        const nextDate = new Date(results[i + 1].updatedAt);
        assert.ok(currentDate >= nextDate);
      }
    });

    test('should sort by priority when specified', async () => {
      const query: TaskSearchQuery = { query: '' };
      const options: SearchOptions = { sortBy: 'priority' };
      const results = await searchEngine.smartSearch(query, options);
      
      // Should have critical priority first
      assert.strictEqual(results[0].priority, 'critical');
    });
  });

  suite('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      const errorApiService = {
        getTasks: async () => {
          throw new Error('API Error');
        },
        getTask: async () => {
          throw new Error('API Error');
        }
              } as unknown as IApiService;
      
      const errorSearchEngine = new TaskSearchEngine(errorApiService as unknown as IApiService);
      
      const results = await errorSearchEngine.findByTitle('test');
      assert.strictEqual(results.length, 0);
      
      const result = await errorSearchEngine.findById(1);
      assert.strictEqual(result, null);
    });
  });
}); 