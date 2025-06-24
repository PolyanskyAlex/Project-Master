import { BaseStrategy } from './BaseStrategy';
import { TaskExecutionStrategy } from '../types/execution';
import { TaskSearchResult } from '../types/search';
import { TaskExecutionContext, TaskExecutionResult } from '../types/execution';

export class DevelopmentStrategy extends BaseStrategy {
  constructor() {
    super(
      TaskExecutionStrategy.DEVELOPMENT,
      'Strategy for implementing new features and development tasks'
    );
  }

  canHandle(task: TaskSearchResult): boolean {
    const title = task.title.toLowerCase();
    const description = task.description.toLowerCase();
    
    return title.includes('implement') || 
           title.includes('create') || 
           title.includes('develop') || 
           title.includes('add') ||
           title.includes('build') ||
           description.includes('feature') ||
           description.includes('implement');
  }

  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const task = context.selectedTask;
    
    try {
      this.logger.info(`Starting development task: ${task.title}`);
      
      // Симуляция выполнения задачи разработки
      // В реальной реализации здесь будет интеграция с AI-агентами
      const steps = [
        'Анализ требований задачи',
        'Планирование архитектуры',
        'Реализация кода',
        'Написание тестов',
        'Код-ревью',
        'Интеграция изменений'
      ];
      
      this.logger.info(`Development strategy executing with ${steps.length} steps`);
      
      return this.createSuccessResult(
        context, 
        `Development task "${task.title}" completed successfully with ${steps.length} steps`
      );
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Development strategy failed: ${errorMessage}`);
      return this.createErrorResult(context, errorMessage);
    }
  }

  estimateTime(task: TaskSearchResult): number {
    // Оценка времени в минутах на основе сложности
    const title = task.title.toLowerCase();
    
    if (title.includes('refactor') || title.includes('optimize')) {
      return 120; // 2 часа
    }
    
    if (title.includes('api') || title.includes('service')) {
      return 180; // 3 часа
    }
    
    if (title.includes('ui') || title.includes('component')) {
      return 90; // 1.5 часа
    }
    
    return 60; // 1 час по умолчанию
  }

  getRequiredTools(): string[] {
    return ['vscode', 'git', 'npm', 'typescript', 'testing-framework'];
  }
} 