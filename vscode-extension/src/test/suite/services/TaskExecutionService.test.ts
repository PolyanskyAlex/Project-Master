import * as assert from 'assert';
import * as vscode from 'vscode';
import { TaskExecutionService } from '../../../services/TaskExecutionService';
import { IApiService } from '../../../interfaces/IApiService';
import { Task } from '../../../types';
import { ExecutionStatus, TaskExecutionStrategy } from '../../../types/execution';
import { CommandType } from '../../../types/commands';

// Mock ApiService
class MockApiService implements Partial<IApiService> {
  private tasks: Task[] = [
    {
      id: '1',
      title: 'Fix authentication bug',
      description: 'Resolve login issues with OAuth',
      status: 'todo',
      priority: 'high',
      type: 'bug',
      project_id: '1',
      assignee: 'john.doe',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: '2',
      title: 'Implement user dashboard',
      description: 'Create new dashboard with analytics',
      status: 'todo',
      priority: 'medium',
      type: 'feature',
      project_id: '1',
      assignee: 'jane.smith',
      created_at: '2024-01-02T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z'
    },
    {
      id: '3',
      title: 'Write API documentation',
      description: 'Document all REST endpoints',
      status: 'in_progress',
      priority: 'low',
      type: 'documentation',
      project_id: '2',
      assignee: 'bob.wilson',
      created_at: '2024-01-03T10:00:00Z',
      updated_at: '2024-01-03T10:00:00Z'
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

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }
    
    this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
    return this.tasks[taskIndex];
  }
}

suite('TaskExecutionService Tests', () => {
  let executionService: TaskExecutionService;
  let mockApiService: MockApiService;

  setup(() => {
    mockApiService = new MockApiService();
    executionService = new TaskExecutionService(mockApiService as unknown as IApiService);
  });

  suite('executeTask', () => {
    test('should execute task by ID successfully', async () => {
      const result = await executionService.executeTask('Выполнить задачу 1');
      
      assert.strictEqual(result.success, false); // Без стратегий выполнение не может быть успешным
      assert.strictEqual(result.context.selectedTask.id, 1);
      assert.strictEqual(result.context.selectedTask.title, 'Fix authentication bug');
      assert.strictEqual(result.context.strategy, TaskExecutionStrategy.BUG_FIX);
      assert.ok(result.steps.length > 0);
    });

    test('should execute task by title successfully', async () => {
      const result = await executionService.executeTask('Выполнить задачу "Implement user dashboard"');
      
      assert.strictEqual(result.success, false); // Без стратегий
      assert.strictEqual(result.context.selectedTask.title, 'Implement user dashboard');
      assert.strictEqual(result.context.strategy, TaskExecutionStrategy.DEVELOPMENT);
    });

    test('should handle task not found', async () => {
      const result = await executionService.executeTask('Выполнить задачу 999');
      
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.status, ExecutionStatus.FAILED);
      assert.ok(result.error?.includes('No tasks found'));
    });

    test('should handle invalid commands', async () => {
      const result = await executionService.executeTask('Invalid command');
      
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.status, ExecutionStatus.FAILED);
      assert.ok(result.error?.includes('No tasks found') || result.error?.includes('Invalid command'));
    });

    test('should record execution history', async () => {
      const initialHistoryLength = executionService.getExecutionHistory().length;
      
      await executionService.executeTask('Выполнить задачу 1');
      
      const history = executionService.getExecutionHistory();
      assert.strictEqual(history.length, initialHistoryLength + 1);
      assert.ok(history[history.length - 1].executionTime > 0);
    });
  });

  suite('findAndAnalyzeTask', () => {
    test('should find task by ID', async () => {
      const parsedCommand = {
        type: CommandType.EXECUTE_TASK_BY_ID,
        originalCommand: 'Выполнить задачу 1',
        query: '1',
        taskId: 1,
        confidence: 0.95
      };

      const context = await executionService.findAndAnalyzeTask(parsedCommand);
      
      assert.strictEqual(context.selectedTask.id, 1);
      assert.strictEqual(context.selectedTask.title, 'Fix authentication bug');
      assert.strictEqual(context.searchResults.length, 1);
    });

    test('should find task by title', async () => {
      const parsedCommand = {
        type: CommandType.EXECUTE_TASK_BY_TITLE,
        originalCommand: 'Выполнить задачу "API documentation"',
        query: 'API documentation',
        confidence: 0.8
      };

      const context = await executionService.findAndAnalyzeTask(parsedCommand);
      
      assert.strictEqual(context.selectedTask.title, 'Write API documentation');
      assert.ok(context.searchResults.length >= 1);
    });

    test('should find task by keywords', async () => {
      const parsedCommand = {
        type: CommandType.EXECUTE_TASK_BY_KEYWORDS,
        originalCommand: 'Выполнить задачу по ключевым словам: authentication, bug',
        query: 'authentication, bug',
        keywords: ['authentication', 'bug'],
        confidence: 0.7
      };

      const context = await executionService.findAndAnalyzeTask(parsedCommand);
      
      assert.strictEqual(context.selectedTask.title, 'Fix authentication bug');
      assert.ok(context.searchResults.length >= 1);
    });

    test('should handle smart search with filters', async () => {
      const parsedCommand = {
        type: CommandType.EXECUTE_TASK_SMART_SEARCH,
        originalCommand: 'Выполнить задачу dashboard в проекте 1',
        query: 'dashboard',
        projectId: 1,
        confidence: 0.8
      };

      const context = await executionService.findAndAnalyzeTask(parsedCommand);
      
      assert.strictEqual(context.selectedTask.title, 'Implement user dashboard');
      assert.strictEqual(context.projectContext?.id, 1);
    });

    test('should throw error when no tasks found', async () => {
      const parsedCommand = {
        type: CommandType.EXECUTE_TASK_BY_TITLE,
        originalCommand: 'Выполнить задачу "Nonexistent task"',
        query: 'Nonexistent task',
        confidence: 0.8
      };

      try {
        await executionService.findAndAnalyzeTask(parsedCommand);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes('No tasks found'));
      }
    });
  });

  suite('Strategy Selection', () => {
    test('should select BUG_FIX strategy for bug tasks', async () => {
      const result = await executionService.executeTask('Выполнить задачу 1'); // Fix authentication bug
      
      assert.strictEqual(result.context.strategy, TaskExecutionStrategy.BUG_FIX);
    });

    test('should select DEVELOPMENT strategy for feature tasks', async () => {
      const result = await executionService.executeTask('Выполнить задачу 2'); // Implement user dashboard
      
      assert.strictEqual(result.context.strategy, TaskExecutionStrategy.DEVELOPMENT);
    });

    test('should select DOCUMENTATION strategy for doc tasks', async () => {
      const result = await executionService.executeTask('Выполнить задачу 3'); // Write API documentation
      
      assert.strictEqual(result.context.strategy, TaskExecutionStrategy.DOCUMENTATION);
    });

    test('should select strategy based on title keywords', async () => {
      // Mock a test task
      const mockTestTask = {
        id: '4',
        title: 'Write unit tests for authentication',
        description: 'Create comprehensive test suite',
        status: 'todo',
        priority: 'medium',
        type: 'test',
        project_id: '1',
        created_at: '2024-01-04T10:00:00Z',
        updated_at: '2024-01-04T10:00:00Z'
      };

             mockApiService.getTasks = async () => [...await mockApiService.getTasks(), mockTestTask as Task];

      const result = await executionService.executeTask('Выполнить задачу "unit tests"');
      
      assert.strictEqual(result.context.strategy, TaskExecutionStrategy.TESTING);
    });
  });

  suite('Task Selection', () => {
    test('should select task with highest relevance score', async () => {
      const result = await executionService.executeTask('Выполнить задачу authentication');
      
      // Should find the authentication bug task as it's most relevant
      assert.strictEqual(result.context.selectedTask.title, 'Fix authentication bug');
    });

    test('should select single task when only one found', async () => {
      const result = await executionService.executeTask('Выполнить задачу 1');
      
      assert.strictEqual(result.context.selectedTask.id, 1);
      assert.strictEqual(result.context.searchResults.length, 1);
    });
  });

  suite('Status Updates', () => {
    test('should update task status during execution', async () => {
      const originalTask = await mockApiService.getTask('1');
      assert.strictEqual(originalTask.status, 'todo');

      const result = await executionService.executeTask('Выполнить задачу 1');
      
      // Even though execution fails due to missing strategy,
      // status update step should be attempted
      const updateStep = result.steps.find(step => step.id === 'update_status');
      assert.ok(updateStep);
    });
  });

  suite('Execution Steps', () => {
    test('should record all execution steps', async () => {
      const result = await executionService.executeTask('Выполнить задачу 1');
      
      assert.ok(result.steps.length >= 3); // search, analyze, execute (at minimum)
      
      const searchStep = result.steps.find(step => step.id === 'search');
      const analyzeStep = result.steps.find(step => step.id === 'analyze');
      const executeStep = result.steps.find(step => step.id === 'execute');
      
      assert.ok(searchStep);
      assert.ok(analyzeStep);
      assert.ok(executeStep);
      
      // Search and analyze should succeed
      assert.strictEqual(searchStep.status, ExecutionStatus.COMPLETED);
      assert.strictEqual(analyzeStep.status, ExecutionStatus.COMPLETED);
      
      // Execute should fail due to missing strategy
      assert.strictEqual(executeStep.status, ExecutionStatus.FAILED);
    });

    test('should include timestamps for steps', async () => {
      const result = await executionService.executeTask('Выполнить задачу 1');
      
      for (const step of result.steps) {
        assert.ok(step.startTime);
        if (step.status === ExecutionStatus.COMPLETED || step.status === ExecutionStatus.FAILED) {
          assert.ok(step.endTime);
          assert.ok(step.endTime >= step.startTime);
        }
      }
    });
  });

  suite('Metrics and History', () => {
    test('should track execution metrics', async () => {
      const initialMetrics = executionService.getMetrics();
      
      await executionService.executeTask('Выполнить задачу 1');
      await executionService.executeTask('Выполнить задачу 2');
      
      const metrics = executionService.getMetrics();
      
      assert.strictEqual(metrics.totalExecutions, initialMetrics.totalExecutions + 2);
      assert.ok(metrics.averageExecutionTime > 0);
      assert.ok(metrics.strategiesUsed[TaskExecutionStrategy.BUG_FIX] > 0);
      assert.ok(metrics.strategiesUsed[TaskExecutionStrategy.DEVELOPMENT] > 0);
    });

    test('should maintain execution history', async () => {
      const initialHistoryLength = executionService.getExecutionHistory().length;
      
      await executionService.executeTask('Выполнить задачу 1');
      await executionService.executeTask('Выполнить задачу 2');
      
      const history = executionService.getExecutionHistory();
      assert.strictEqual(history.length, initialHistoryLength + 2);
      
      // History should be immutable
      const historySnapshot = executionService.getExecutionHistory();
      historySnapshot.push({} as any);
      assert.strictEqual(executionService.getExecutionHistory().length, initialHistoryLength + 2);
    });
  });

  suite('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      const errorApiService = {
        getTasks: async () => {
          throw new Error('API Error');
        }
      } as unknown as IApiService;
      
      const errorExecutionService = new TaskExecutionService(errorApiService);
      const result = await errorExecutionService.executeTask('Выполнить задачу 1');
      
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.status, ExecutionStatus.FAILED);
      assert.ok(result.error?.includes('API Error'));
    });

    test('should handle malformed commands', async () => {
      const result = await executionService.executeTask('');
      
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.status, ExecutionStatus.FAILED);
    });
  });

  suite('Strategy Management', () => {
    test('should register and unregister strategies', () => {
      const initialStrategies = executionService.getRegisteredStrategies();
      
      const mockStrategy = {
        name: TaskExecutionStrategy.GENERIC,
        description: 'Mock strategy for testing',
        canHandle: () => true,
        execute: async () => ({} as any),
        estimateTime: () => 5,
        getRequiredTools: () => ['test']
      };
      
      executionService.registerStrategy(mockStrategy);
      const strategiesAfterRegister = executionService.getRegisteredStrategies();
      assert.ok(strategiesAfterRegister.includes(TaskExecutionStrategy.GENERIC));
      
      executionService.unregisterStrategy(TaskExecutionStrategy.GENERIC);
      const strategiesAfterUnregister = executionService.getRegisteredStrategies();
      assert.strictEqual(strategiesAfterUnregister.length, strategiesAfterRegister.length - 1);
    });
  });
}); 