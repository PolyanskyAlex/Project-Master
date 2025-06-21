export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private sessionId: string;
  private autoSaveInterval: number = 5 * 60 * 1000; // 5 минут
  private autoSaveTimer?: NodeJS.Timeout;
  private lastSaveIndex: number = 0;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
    this.sessionId = this.generateSessionId();
    
    // Логируем начало сессии
    this.info('Logger initialized', { sessionId: this.sessionId });

    // Запускаем автоматическое сохранение
    this.startAutoSave();

    // Сохраняем логи при закрытии страницы
    window.addEventListener('beforeunload', () => {
      this.saveLogsToServer(true);
    });
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(level: LogLevel, message: string, data?: any, source?: string): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message,
      data,
      source,
      sessionId: this.sessionId
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Ограничиваем количество логов в памяти
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Выводим в консоль браузера
    this.outputToConsole(entry);
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${levelName}]`;
    
    let message = `${prefix} ${entry.message}`;
    if (entry.source) {
      message += ` (${entry.source})`;
    }

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data);
        break;
    }
  }

  debug(message: string, data?: any, source?: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, data, source);
      this.addLog(entry);
    }
  }

  info(message: string, data?: any, source?: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, message, data, source);
      this.addLog(entry);
    }
  }

  warn(message: string, data?: any, source?: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, message, data, source);
      this.addLog(entry);
    }
  }

  error(message: string, data?: any, source?: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createLogEntry(LogLevel.ERROR, message, data, source);
      this.addLog(entry);
    }
  }

  // API методы для логирования
  logApiRequest(method: string, url: string, data?: any): void {
    this.debug(`API Request: ${method} ${url}`, data, 'API');
  }

  logApiResponse(method: string, url: string, status: number, data?: any): void {
    const message = `API Response: ${method} ${url} - ${status}`;
    if (status >= 400) {
      this.error(message, data, 'API');
    } else {
      this.debug(message, data, 'API');
    }
  }

  logApiError(method: string, url: string, error: any): void {
    this.error(`API Error: ${method} ${url}`, error, 'API');
  }

  // UI методы для логирования
  logUserAction(action: string, data?: any): void {
    this.info(`User Action: ${action}`, data, 'UI');
  }

  logNavigation(from: string, to: string): void {
    this.info(`Navigation: ${from} -> ${to}`, undefined, 'Navigation');
  }

  logError(error: Error, context?: string): void {
    this.error(`Application Error${context ? ` (${context})` : ''}`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    }, 'Application');
  }

  // Методы для работы с логами
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  getLogsBySource(source: string): LogEntry[] {
    return this.logs.filter(log => log.source === source);
  }

  clearLogs(): void {
    this.logs = [];
    this.info('Logs cleared');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level changed to ${LogLevel[level]}`);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // Автоматическое сохранение логов
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      this.saveLogsToServer();
    }, this.autoSaveInterval);
  }

  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  private async saveLogsToServer(isBeforeUnload: boolean = false): Promise<void> {
    // Получаем только новые логи с последнего сохранения
    const newLogs = this.logs.slice(this.lastSaveIndex);
    
    if (newLogs.length === 0) {
      return;
    }

    try {
      const logsData = {
        timestamp: new Date().toISOString(),
        logs: newLogs,
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.sessionId,
        isBeforeUnload
      };

      const response = await fetch('/api/v1/frontend-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.REACT_APP_API_KEY || 'dev-api-key-12345'
        },
        body: JSON.stringify(logsData),
        // Для beforeunload используем keepalive
        keepalive: isBeforeUnload
      });

      if (response.ok) {
        this.lastSaveIndex = this.logs.length;
        if (!isBeforeUnload) {
          this.debug('Logs auto-saved to server', { 
            count: newLogs.length,
            total: this.logs.length 
          }, 'Logger');
        }
      }
    } catch (error) {
      if (!isBeforeUnload) {
        this.error('Failed to auto-save logs to server', { error }, 'Logger');
      }
    }
  }

  // Принудительное сохранение всех логов
  async forceSaveToServer(): Promise<boolean> {
    try {
      const logsData = {
        timestamp: new Date().toISOString(),
        logs: this.logs,
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.sessionId,
        isForced: true
      };

      const response = await fetch('/api/v1/frontend-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.REACT_APP_API_KEY || 'dev-api-key-12345'
        },
        body: JSON.stringify(logsData)
      });

      if (response.ok) {
        this.lastSaveIndex = this.logs.length;
        this.info('All logs force-saved to server', { 
          count: this.logs.length 
        }, 'Logger');
        return true;
      }
      return false;
    } catch (error) {
      this.error('Failed to force-save logs to server', { error }, 'Logger');
      return false;
    }
  }
}

// Создаем глобальный экземпляр логгера
const isDevelopment = process.env.NODE_ENV === 'development';
export const logger = new Logger(isDevelopment ? LogLevel.DEBUG : LogLevel.INFO);

// Перехватываем необработанные ошибки
window.addEventListener('error', (event) => {
  logger.error('Unhandled Error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  }, 'Global');
});

// Перехватываем необработанные промисы
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection', {
    reason: event.reason
  }, 'Global');
});

export default logger; 