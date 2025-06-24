import { 
  ITaskExecutionStrategy, 
  TaskExecutionContext, 
  TaskExecutionResult, 
  TaskExecutionStrategy,
  ExecutionStatus 
} from '../types/execution';
import { TaskSearchResult } from '../types/search';
import { Logger } from '../utils/Logger';

export abstract class BaseStrategy implements ITaskExecutionStrategy {
  protected logger: Logger;

  constructor(
    public readonly name: TaskExecutionStrategy,
    public readonly description: string
  ) {
    this.logger = new Logger();
  }

  abstract canHandle(task: TaskSearchResult): boolean;
  abstract execute(context: TaskExecutionContext): Promise<TaskExecutionResult>;
  abstract estimateTime(task: TaskSearchResult): number;
  abstract getRequiredTools(): string[];

  protected createSuccessResult(context: TaskExecutionContext, message: string): TaskExecutionResult {
    return {
      success: true,
      status: ExecutionStatus.COMPLETED,
      context,
      steps: [],
      executionTime: Date.now() - context.startTime.getTime(),
      logs: [message],
      warnings: []
    };
  }

  protected createErrorResult(context: TaskExecutionContext, error: string): TaskExecutionResult {
    return {
      success: false,
      status: ExecutionStatus.FAILED,
      context,
      steps: [],
      executionTime: Date.now() - context.startTime.getTime(),
      error,
      logs: [`Error: ${error}`],
      warnings: []
    };
  }
} 