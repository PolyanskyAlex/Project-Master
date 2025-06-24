import * as vscode from 'vscode';
import { IApiService } from '../interfaces/IApiService';
import { TaskSearchEngine } from './TaskSearchEngine';
import { TaskCommandParser } from '../utils/TaskCommandParser';
import { Logger } from '../utils/Logger';
import { 
  ITaskExecutionService,
  ITaskExecutionStrategy,
  TaskExecutionResult,
  TaskExecutionContext,
  TaskExecutionStep,
  ExecutionStatus,
  TaskExecutionStrategy,
  ExecutionMetrics
} from '../types/execution';
import { ParsedTaskCommand, CommandType } from '../types/commands';
import { TaskSearchResult, TaskSearchQuery } from '../types/search';
import { Task } from '../types';

export class TaskExecutionService implements ITaskExecutionService {
  private logger: Logger;
  private searchEngine: TaskSearchEngine;
  private commandParser: TaskCommandParser;
  private strategies: Map<TaskExecutionStrategy, ITaskExecutionStrategy>;
  private executionHistory: TaskExecutionResult[] = [];
  private activeExecutions: Map<string, TaskExecutionResult> = new Map();

  constructor(
    private apiService: IApiService
  ) {
    this.logger = new Logger();
    this.searchEngine = new TaskSearchEngine(apiService);
    this.commandParser = new TaskCommandParser();
    this.strategies = new Map();
    this.initializeStrategies();
  }

  async executeTask(command: string): Promise<TaskExecutionResult> {
    this.logger.info(`Starting task execution for command: ${command}`);
    
    const parsedCommand = this.commandParser.parse(command);
    return this.executeTaskFromParsed(parsedCommand);
  }

  async executeTaskFromParsed(parsedCommand: ParsedTaskCommand): Promise<TaskExecutionResult> {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();
    
    let result: TaskExecutionResult = {
      success: false,
      status: ExecutionStatus.PENDING,
      context: {
        command: parsedCommand,
        searchResults: [],
        selectedTask: {} as TaskSearchResult,
        strategy: TaskExecutionStrategy.GENERIC,
        startTime: new Date()
      },
      steps: [],
      executionTime: 0,
      logs: [],
      error: undefined
    };

    try {
      // Валидация команды
      const validation = this.commandParser.validate(parsedCommand.originalCommand);
      if (!validation.isValid) {
        throw new Error(`Invalid command: ${validation.errors.join(', ')}`);
      }

      // Этап 1: Поиск задачи
      result = await this.executeStep(result, 'search', 'Поиск задачи', async () => {
        const context = await this.findAndAnalyzeTask(parsedCommand);
        result.context = context;
        return { searchResults: context.searchResults, selectedTask: context.selectedTask };
      });

      if (!result.success) {
        return result;
      }

      // Этап 2: Анализ и выбор стратегии
      result = await this.executeStep(result, 'analyze', 'Анализ задачи и выбор стратегии', async () => {
        const strategy = this.selectExecutionStrategy(result.context.selectedTask);
        result.context.strategy = strategy;
        return { strategy };
      });

      // Этап 3: Выполнение задачи
      result = await this.executeStep(result, 'execute', 'Выполнение задачи', async () => {
        const strategy = this.strategies.get(result.context.strategy);
        if (!strategy) {
          throw new Error(`Strategy not found: ${result.context.strategy}`);
        }

        const strategyResult = await strategy.execute(result.context);
        return strategyResult;
      });

      // Этап 4: Обновление статуса в Project Master
      result = await this.executeStep(result, 'update_status', 'Обновление статуса задачи', async () => {
        const updatedTask = await this.updateTaskStatus(result.context.selectedTask, 'in_progress');
        result.updatedTask = updatedTask;
        return { updatedTask };
      });

      result.status = ExecutionStatus.COMPLETED;
      result.success = true;

    } catch (error) {
      result.status = ExecutionStatus.FAILED;
      result.error = error instanceof Error ? error.message : String(error);
      this.logger.error(`Task execution failed: ${result.error}`, error);
    } finally {
      result.executionTime = Date.now() - startTime;
      this.executionHistory.push(result);
      this.activeExecutions.delete(executionId);
      
      this.logger.info(`Task execution completed`, {
        success: result.success,
        executionTime: result.executionTime,
        strategy: result.context.strategy
      });
    }

    return result;
  }

  async findAndAnalyzeTask(parsedCommand: ParsedTaskCommand): Promise<TaskExecutionContext> {
    let searchResults: TaskSearchResult[] = [];

    // Поиск в зависимости от типа команды
    switch (parsedCommand.type) {
      case CommandType.EXECUTE_TASK_BY_ID:
        if (parsedCommand.taskId) {
          const task = await this.searchEngine.findById(parsedCommand.taskId);
          if (task) {
            searchResults = [task];
          }
        }
        break;

      case CommandType.EXECUTE_TASK_BY_TITLE:
        searchResults = await this.searchEngine.findByTitle(parsedCommand.query);
        break;

      case CommandType.EXECUTE_TASK_BY_KEYWORDS:
        if (parsedCommand.keywords) {
          searchResults = await this.searchEngine.findByKeywords(parsedCommand.keywords);
        }
        break;

      case CommandType.EXECUTE_TASK_SMART_SEARCH:
        const searchQuery: TaskSearchQuery = {
          query: parsedCommand.query,
          projectId: parsedCommand.projectId,
          status: parsedCommand.status,
          priority: parsedCommand.priority,
          assignedTo: parsedCommand.assignee
        };
        searchResults = await this.searchEngine.smartSearch(searchQuery);
        break;

      default:
        throw new Error(`Unsupported command type: ${parsedCommand.type}`);
    }

    if (searchResults.length === 0) {
      throw new Error(`No tasks found for query: ${parsedCommand.query}`);
    }

    // Выбор наиболее подходящей задачи
    const selectedTask = this.selectBestTask(searchResults, parsedCommand);
    
    // Получение контекста workspace
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    
    const context: TaskExecutionContext = {
      command: parsedCommand,
      searchResults,
      selectedTask,
      strategy: TaskExecutionStrategy.GENERIC, // будет определена позже
      startTime: new Date(),
      workspaceRoot,
      projectContext: selectedTask.projectId ? {
        id: selectedTask.projectId,
        name: selectedTask.projectName || 'Unknown Project'
      } : undefined
    };

    this.logger.info(`Task found and analyzed`, {
      taskId: selectedTask.id,
      title: selectedTask.title,
      searchResultsCount: searchResults.length
    });

    return context;
  }

  getExecutionHistory(): TaskExecutionResult[] {
    return [...this.executionHistory];
  }

  getMetrics(): ExecutionMetrics {
    const total = this.executionHistory.length;
    const successful = this.executionHistory.filter(r => r.success).length;
    const failed = total - successful;
    
    const totalTime = this.executionHistory.reduce((sum, r) => sum + r.executionTime, 0);
    const averageTime = total > 0 ? totalTime / total : 0;

    const strategiesUsed = {} as { [key in TaskExecutionStrategy]: number };
    const commonErrors = {} as { [error: string]: number };

    for (const strategy of Object.values(TaskExecutionStrategy)) {
      strategiesUsed[strategy] = 0;
    }

    for (const result of this.executionHistory) {
      strategiesUsed[result.context.strategy]++;
      
      if (result.error) {
        commonErrors[result.error] = (commonErrors[result.error] || 0) + 1;
      }
    }

    return {
      totalExecutions: total,
      successfulExecutions: successful,
      failedExecutions: failed,
      averageExecutionTime: averageTime,
      strategiesUsed,
      commonErrors
    };
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      execution.status = ExecutionStatus.CANCELLED;
      this.activeExecutions.delete(executionId);
      this.logger.info(`Execution cancelled: ${executionId}`);
      return true;
    }
    return false;
  }

  private async executeStep<T>(
    result: TaskExecutionResult,
    stepId: string,
    stepName: string,
    action: () => Promise<T>
  ): Promise<TaskExecutionResult> {
    const step: TaskExecutionStep = {
      id: stepId,
      name: stepName,
      description: stepName,
      status: ExecutionStatus.PENDING,
      startTime: new Date()
    };

    result.steps.push(step);
    result.logs.push(`Starting step: ${stepName}`);

    try {
      step.status = ExecutionStatus.EXECUTING;
      const stepResult = await action();
      
      step.status = ExecutionStatus.COMPLETED;
      step.endTime = new Date();
      step.result = stepResult;
      
      result.logs.push(`Completed step: ${stepName}`);
      result.success = true;
      
    } catch (error) {
      step.status = ExecutionStatus.FAILED;
      step.endTime = new Date();
      step.error = error instanceof Error ? error.message : String(error);
      
      result.success = false;
      result.status = ExecutionStatus.FAILED;
      result.error = step.error;
      result.logs.push(`Failed step: ${stepName} - ${step.error}`);
      
      this.logger.error(`Step failed: ${stepName}`, error);
    }

    return result;
  }

  private selectBestTask(searchResults: TaskSearchResult[], command: ParsedTaskCommand): TaskSearchResult {
    if (searchResults.length === 1) {
      return searchResults[0];
    }

    // Сортировка по релевантности и приоритету
    const sorted = searchResults.sort((a, b) => {
      // Приоритет релевантности
      const relevanceA = a.relevanceScore || 0;
      const relevanceB = b.relevanceScore || 0;
      if (relevanceA !== relevanceB) {
        return relevanceB - relevanceA;
      }

      // Приоритет задачи
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const priorityA = priorityOrder[a.priority.toLowerCase() as keyof typeof priorityOrder] || 0;
      const priorityB = priorityOrder[b.priority.toLowerCase() as keyof typeof priorityOrder] || 0;
      
      return priorityB - priorityA;
    });

    return sorted[0];
  }

  private selectExecutionStrategy(task: TaskSearchResult): TaskExecutionStrategy {
    // Анализ типа задачи и выбор стратегии
    const title = task.title.toLowerCase();
    const description = task.description.toLowerCase();
    // TaskSearchResult не имеет поля type, используем анализ title и description

    if (title.includes('fix') || title.includes('bug') || title.includes('error')) {
      return TaskExecutionStrategy.BUG_FIX;
    }

    if (title.includes('test') || description.includes('test') || title.includes('testing')) {
      return TaskExecutionStrategy.TESTING;
    }

    if (title.includes('doc') || title.includes('readme') || description.includes('documentation')) {
      return TaskExecutionStrategy.DOCUMENTATION;
    }

    if (title.includes('review') || description.includes('review')) {
      return TaskExecutionStrategy.REVIEW;
    }

    if (title.includes('deploy') || description.includes('deploy') || title.includes('release')) {
      return TaskExecutionStrategy.DEPLOYMENT;
    }

    if (title.includes('implement') || title.includes('create') || title.includes('develop') || title.includes('add')) {
      return TaskExecutionStrategy.DEVELOPMENT;
    }

    return TaskExecutionStrategy.GENERIC;
  }

  private async updateTaskStatus(task: TaskSearchResult, newStatus: string): Promise<Task> {
    try {
      const updatedTask = await this.apiService.updateTask(task.id.toString(), {
        status: newStatus as any
      });
      
      this.logger.info(`Task status updated`, {
        taskId: task.id,
        oldStatus: task.status,
        newStatus
      });
      
      return updatedTask;
    } catch (error) {
      this.logger.error(`Failed to update task status`, error);
      throw error;
    }
  }

  private initializeStrategies(): void {
    // Здесь будут зарегистрированы конкретные стратегии выполнения
    // Пока оставляем пустым, стратегии будут добавлены в следующих подзадачах
    this.logger.info('Task execution strategies initialized');
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Методы для регистрации стратегий (будут использоваться в следующих подзадачах)
  registerStrategy(strategy: ITaskExecutionStrategy): void {
    this.strategies.set(strategy.name, strategy);
    this.logger.info(`Strategy registered: ${strategy.name}`);
  }

  unregisterStrategy(strategyName: TaskExecutionStrategy): void {
    this.strategies.delete(strategyName);
    this.logger.info(`Strategy unregistered: ${strategyName}`);
  }

  getRegisteredStrategies(): TaskExecutionStrategy[] {
    return Array.from(this.strategies.keys());
  }
} 