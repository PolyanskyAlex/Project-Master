import { Task } from './index';
import { ParsedTaskCommand } from './commands';
import { TaskSearchResult } from './search';

export enum ExecutionStatus {
  PENDING = 'pending',
  SEARCHING = 'searching',
  FOUND = 'found',
  ANALYZING = 'analyzing',
  EXECUTING = 'executing',
  UPDATING_STATUS = 'updating_status',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TaskExecutionStrategy {
  DEVELOPMENT = 'development',
  BUG_FIX = 'bug_fix',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  REVIEW = 'review',
  DEPLOYMENT = 'deployment',
  GENERIC = 'generic'
}

export interface TaskExecutionContext {
  command: ParsedTaskCommand;
  searchResults: TaskSearchResult[];
  selectedTask: TaskSearchResult;
  strategy: TaskExecutionStrategy;
  startTime: Date;
  workspaceRoot?: string;
  projectContext?: {
    id: number;
    name: string;
    path?: string;
  };
}

export interface TaskExecutionStep {
  id: string;
  name: string;
  description: string;
  status: ExecutionStatus;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  result?: any;
}

export interface TaskExecutionResult {
  success: boolean;
  status: ExecutionStatus;
  context: TaskExecutionContext;
  steps: TaskExecutionStep[];
  executionTime: number;
  error?: string;
  warnings?: string[];
  logs: string[];
  updatedTask?: Task;
}

export interface ExecutionMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  strategiesUsed: { [key in TaskExecutionStrategy]: number };
  commonErrors: { [error: string]: number };
}

export interface ITaskExecutionService {
  executeTask(command: string): Promise<TaskExecutionResult>;
  executeTaskFromParsed(parsedCommand: ParsedTaskCommand): Promise<TaskExecutionResult>;
  findAndAnalyzeTask(parsedCommand: ParsedTaskCommand): Promise<TaskExecutionContext>;
  getExecutionHistory(): TaskExecutionResult[];
  getMetrics(): ExecutionMetrics;
  cancelExecution(executionId: string): Promise<boolean>;
}

export interface ITaskExecutionStrategy {
  readonly name: TaskExecutionStrategy;
  readonly description: string;
  canHandle(task: TaskSearchResult): boolean;
  execute(context: TaskExecutionContext): Promise<TaskExecutionResult>;
  estimateTime(task: TaskSearchResult): number; // в минутах
  getRequiredTools(): string[];
} 