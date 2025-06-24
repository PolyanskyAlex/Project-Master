export enum CommandType {
  EXECUTE_TASK_BY_ID = 'execute_task_by_id',
  EXECUTE_TASK_BY_TITLE = 'execute_task_by_title',
  EXECUTE_TASK_BY_KEYWORDS = 'execute_task_by_keywords',
  EXECUTE_TASK_SMART_SEARCH = 'execute_task_smart_search',
  INVALID_COMMAND = 'invalid_command'
}

export interface ParsedTaskCommand {
  type: CommandType;
  originalCommand: string;
  query: string;
  taskId?: number;
  projectId?: number;
  projectName?: string;
  priority?: string;
  status?: string;
  assignee?: string;
  keywords?: string[];
  confidence: number; // 0-1, уверенность в правильности парсинга
  suggestions?: string[]; // предложения для исправления
}

export interface CommandPattern {
  pattern: RegExp;
  type: CommandType;
  extractors: {
    [key: string]: (match: RegExpMatchArray) => any;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ITaskCommandParser {
  parse(command: string): ParsedTaskCommand;
  validate(command: string): ValidationResult;
  getSuggestions(command: string): string[];
} 