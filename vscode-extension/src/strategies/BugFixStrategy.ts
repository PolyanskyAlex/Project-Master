import { BaseStrategy } from './BaseStrategy';
import { TaskExecutionStrategy } from '../types/execution';
import { TaskSearchResult } from '../types/search';
import { TaskExecutionContext, TaskExecutionResult } from '../types/execution';

export class BugFixStrategy extends BaseStrategy {
  constructor() {
    super(
      TaskExecutionStrategy.BUG_FIX,
      'Strategy for fixing bugs and resolving issues'
    );
  }

  canHandle(task: TaskSearchResult): boolean {
    const title = task.title.toLowerCase();
    const description = task.description.toLowerCase();
    
    return title.includes('fix') || 
           title.includes('bug') || 
           title.includes('error') ||
           title.includes('issue') ||
           description.includes('bug') ||
           description.includes('error') ||
           description.includes('broken');
  }

  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const task = context.selectedTask;
    
    try {
      this.logger.info(`Starting bug fix task: ${task.title}`);
      
      // Симуляция выполнения исправления бага
      const steps = [
        'Воспроизведение ошибки',
        'Анализ причин возникновения',
        'Поиск корневой причины',
        'Разработка исправления',
        'Тестирование исправления',
        'Регрессионное тестирование'
      ];
      
      this.logger.info(`Bug fix strategy executing with ${steps.length} steps`);
      
      return this.createSuccessResult(
        context, 
        `Bug fix "${task.title}" completed successfully. Issue resolved.`
      );
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Bug fix strategy failed: ${errorMessage}`);
      return this.createErrorResult(context, errorMessage);
    }
  }

  estimateTime(task: TaskSearchResult): number {
    const title = task.title.toLowerCase();
    const priority = task.priority.toLowerCase();
    
    // Критические баги требуют больше времени
    if (priority === 'critical' || priority === 'high') {
      return 90; // 1.5 часа
    }
    
    // Сложные системные баги
    if (title.includes('crash') || title.includes('memory') || title.includes('performance')) {
      return 120; // 2 часа
    }
    
    // UI баги обычно быстрее исправляются
    if (title.includes('ui') || title.includes('display') || title.includes('layout')) {
      return 30; // 30 минут
    }
    
    return 60; // 1 час по умолчанию
  }

  getRequiredTools(): string[] {
    return ['vscode', 'debugger', 'git', 'testing-framework', 'browser-devtools'];
  }
} 