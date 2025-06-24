import { 
  CommandType, 
  ParsedTaskCommand, 
  CommandPattern, 
  ValidationResult, 
  ITaskCommandParser 
} from '../types/commands';
import { Logger } from './Logger';

export class TaskCommandParser implements ITaskCommandParser {
  private logger: Logger;
  private patterns: CommandPattern[];

  constructor() {
    this.logger = new Logger();
    this.patterns = this.initializePatterns();
  }

  parse(command: string): ParsedTaskCommand {
    const normalizedCommand = this.normalizeCommand(command);
    
    // Попытка парсинга по каждому паттерну
    for (const pattern of this.patterns) {
      const match = normalizedCommand.match(pattern.pattern);
      if (match) {
        try {
          const parsed = this.extractFromMatch(match, pattern, command);
          this.logger.info(`Command parsed successfully: ${command}`, { type: parsed.type });
          return parsed;
        } catch (error) {
          this.logger.warn(`Failed to extract from pattern: ${pattern.type}`, error);
          continue;
        }
      }
    }

    // Fallback - попытка интеллектуального парсинга
    const fallbackResult = this.intelligentFallback(command);
    this.logger.info(`Using fallback parsing for: ${command}`, { type: fallbackResult.type });
    return fallbackResult;
  }

  validate(command: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!command || command.trim().length === 0) {
      errors.push('Команда не может быть пустой');
      return { isValid: false, errors, warnings };
    }

    if (command.length > 500) {
      errors.push('Команда слишком длинная (максимум 500 символов)');
    }

    const parsed = this.parse(command);
    
    if (parsed.type === CommandType.INVALID_COMMAND) {
      errors.push('Не удалось распознать команду');
      warnings.push('Попробуйте использовать формат: "Выполнить задачу [ID/название]"');
    }

    if (parsed.confidence < 0.5) {
      warnings.push('Низкая уверенность в правильности парсинга команды');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getSuggestions(command: string): string[] {
    const suggestions: string[] = [];
    const normalizedCommand = this.normalizeCommand(command);

    // Базовые предложения
    suggestions.push('Выполнить задачу 123');
    suggestions.push('Выполнить задачу "Название задачи"');
    suggestions.push('Выполнить задачу по ключевым словам: authentication, login');
    suggestions.push('Выполнить задачу в проекте "Project Master"');

    // Анализ ошибок в команде
    if (normalizedCommand.includes('выполни') && !normalizedCommand.includes('выполнить')) {
      suggestions.unshift('Используйте "выполнить" вместо "выполни"');
    }

    if (normalizedCommand.includes('task') && !normalizedCommand.includes('задач')) {
      suggestions.unshift('Выполнить задачу ' + normalizedCommand.replace(/.*task\s*/i, ''));
    }

    return suggestions;
  }

  private initializePatterns(): CommandPattern[] {
    return [
      // Выполнить задачу по ID
      {
        pattern: /(?:выполнить|execute)\s+(?:задачу|task)\s+(?:с\s+)?(?:id\s+)?(\d+)/i,
        type: CommandType.EXECUTE_TASK_BY_ID,
        extractors: {
          taskId: (match) => parseInt(match[1]),
          query: (match) => match[1]
        }
      },

      // Выполнить задачу по названию в кавычках
      {
        pattern: /(?:выполнить|execute)\s+(?:задачу|task)\s*["«]([^"»]+)["»]/i,
        type: CommandType.EXECUTE_TASK_BY_TITLE,
        extractors: {
          query: (match) => match[1].trim()
        }
      },

      // Выполнить задачу по названию без кавычек
      {
        pattern: /(?:выполнить|execute)\s+(?:задачу|task)\s+(?:с\s+названием\s+|по\s+названию\s+)?(.+?)(?:\s+в\s+проекте\s+(.+))?$/i,
        type: CommandType.EXECUTE_TASK_BY_TITLE,
        extractors: {
          query: (match) => match[1].trim(),
          projectName: (match) => match[2]?.trim()
        }
      },

      // Выполнить задачу по ключевым словам
      {
        pattern: /(?:выполнить|execute)\s+(?:задачу|task)\s+по\s+(?:ключевым\s+словам|keywords)\s*:\s*(.+)/i,
        type: CommandType.EXECUTE_TASK_BY_KEYWORDS,
        extractors: {
          query: (match) => match[1].trim(),
          keywords: (match) => match[1].split(/[,\s]+/).filter(k => k.length > 0)
        }
      },

      // Выполнить задачу в проекте с дополнительными параметрами
      {
        pattern: /(?:выполнить|execute)\s+(?:задачу|task)\s+(.+?)\s+в\s+проекте\s+["«]?([^"»\s]+)["»]?(?:\s+(?:со\s+статусом|with\s+status)\s+(\w+))?(?:\s+(?:с\s+приоритетом|with\s+priority)\s+(\w+))?/i,
        type: CommandType.EXECUTE_TASK_SMART_SEARCH,
        extractors: {
          query: (match) => match[1].trim(),
          projectName: (match) => match[2].trim(),
          status: (match) => match[3]?.toLowerCase(),
          priority: (match) => match[4]?.toLowerCase()
        }
      },

      // Выполнить задачу назначенную пользователю
      {
        pattern: /(?:выполнить|execute)\s+(?:задачу|task)\s+(.+?)\s+(?:назначенную|assigned\s+to)\s+(.+)/i,
        type: CommandType.EXECUTE_TASK_SMART_SEARCH,
        extractors: {
          query: (match) => match[1].trim(),
          assignee: (match) => match[2].trim()
        }
      },

      // Простая команда "выполнить задачу X"
      {
        pattern: /(?:выполнить|execute)\s+(?:задачу|task)\s+(.+)/i,
        type: CommandType.EXECUTE_TASK_SMART_SEARCH,
        extractors: {
          query: (match) => match[1].trim()
        }
      }
    ];
  }

  private normalizeCommand(command: string): string {
    return command
      .trim()
      .replace(/\s+/g, ' ') // множественные пробелы в один
      .replace(/[""]/g, '"') // нормализация кавычек
      .replace(/[«»]/g, '"'); // русские кавычки в обычные
  }

  private extractFromMatch(
    match: RegExpMatchArray, 
    pattern: CommandPattern, 
    originalCommand: string
  ): ParsedTaskCommand {
    const result: ParsedTaskCommand = {
      type: pattern.type,
      originalCommand,
      query: '',
      confidence: 0.8
    };

    // Применяем экстракторы
    for (const [key, extractor] of Object.entries(pattern.extractors)) {
      try {
        const value = extractor(match);
        if (value !== undefined && value !== null) {
          (result as any)[key] = value;
        }
      } catch (error) {
        this.logger.warn(`Failed to extract ${key} from match`, error);
      }
    }

    // Обработка специальных случаев
    if (pattern.type === CommandType.EXECUTE_TASK_BY_ID && result.taskId) {
      result.confidence = 0.95; // высокая уверенность для ID
    }

    // Определение projectId по projectName (если есть)
    if (result.projectName) {
      result.projectId = this.getProjectIdByName(result.projectName);
    }

    return result;
  }

  private intelligentFallback(command: string): ParsedTaskCommand {
    const normalizedCommand = this.normalizeCommand(command);
    
    // Попытка найти числа (возможные ID)
    const numberMatch = normalizedCommand.match(/\b(\d+)\b/);
    if (numberMatch) {
      const taskId = parseInt(numberMatch[1]);
      if (taskId > 0 && taskId < 100000) { // разумные границы для ID
        return {
          type: CommandType.EXECUTE_TASK_BY_ID,
          originalCommand: command,
          query: numberMatch[1],
          taskId,
          confidence: 0.6
        };
      }
    }

    // Попытка извлечь текст после ключевых слов
    const textMatch = normalizedCommand.match(/(?:выполнить|execute|задачу|task)\s+(.+)/i);
    if (textMatch) {
      const query = textMatch[1].trim();
      const keywords = query.split(/\s+/).filter(word => word.length > 2);
      
      return {
        type: keywords.length > 1 ? CommandType.EXECUTE_TASK_BY_KEYWORDS : CommandType.EXECUTE_TASK_BY_TITLE,
        originalCommand: command,
        query,
        keywords: keywords.length > 1 ? keywords : undefined,
        confidence: 0.4,
        suggestions: this.getSuggestions(command)
      };
    }

    // Полный fallback
    return {
      type: CommandType.INVALID_COMMAND,
      originalCommand: command,
      query: command,
      confidence: 0.1,
      suggestions: this.getSuggestions(command)
    };
  }

  private getProjectIdByName(projectName: string): number | undefined {
    // Здесь можно добавить кэш проектов или интеграцию с API
    // Пока возвращаем undefined, логика будет добавлена позже
    this.logger.debug(`Project name lookup not implemented: ${projectName}`);
    return undefined;
  }
}

// Утилитные функции для работы с командами
export class CommandUtils {
  static isTaskId(query: string): boolean {
    return /^\d+$/.test(query.trim());
  }

  static extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^\w\u0400-\u04FF]+/) // разделение по не-буквенным символам, включая кириллицу
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));
  }

  static isStopWord(word: string): boolean {
    const stopWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'и', 'или', 'но', 'в', 'на', 'для', 'с', 'по', 'от', 'до', 'за', 'под', 'над'
    ];
    return stopWords.includes(word.toLowerCase());
  }

  static normalizeTaskTitle(title: string): string {
    return title
      .trim()
      .replace(/^["«]|["»]$/g, '') // убираем кавычки с начала и конца
      .replace(/\s+/g, ' '); // нормализуем пробелы
  }
} 