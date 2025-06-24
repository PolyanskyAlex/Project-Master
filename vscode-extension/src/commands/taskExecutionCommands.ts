import * as vscode from 'vscode';
import { TaskExecutionService } from '../services/TaskExecutionService';
import { ApiService } from '../services/ApiService';
import { ConfigurationService } from '../services/ConfigurationService';
import { Logger } from '../utils/Logger';
import { DevelopmentStrategy } from '../strategies/DevelopmentStrategy';
import { BugFixStrategy } from '../strategies/BugFixStrategy';
import { ExecutionStatus } from '../types/execution';

export class TaskExecutionCommands {
  private executionService: TaskExecutionService;

  constructor() {
    const configService = new ConfigurationService();
    const logger = new Logger();
    const apiService = new ApiService(configService, logger);
    this.executionService = new TaskExecutionService(apiService);
    
    // Регистрируем стратегии
    this.executionService.registerStrategy(new DevelopmentStrategy());
    this.executionService.registerStrategy(new BugFixStrategy());
  }

  registerCommands(context: vscode.ExtensionContext): void {
    // Команда для выполнения задачи по команде
    const executeTaskCommand = vscode.commands.registerCommand(
      'projectMaster.executeTask',
      () => this.executeTaskCommand()
    );

    // Команда для выполнения задачи по ID
    const executeTaskByIdCommand = vscode.commands.registerCommand(
      'projectMaster.executeTaskById',
      () => this.executeTaskByIdCommand()
    );

    // Команда для просмотра истории выполнения
    const showExecutionHistoryCommand = vscode.commands.registerCommand(
      'projectMaster.showExecutionHistory',
      () => this.showExecutionHistoryCommand()
    );

    // Команда для просмотра метрик
    const showExecutionMetricsCommand = vscode.commands.registerCommand(
      'projectMaster.showExecutionMetrics',
      () => this.showExecutionMetricsCommand()
    );

    context.subscriptions.push(
      executeTaskCommand,
      executeTaskByIdCommand,
      showExecutionHistoryCommand,
      showExecutionMetricsCommand
    );
  }

  private async executeTaskCommand(): Promise<void> {
    try {
      // Запрос команды у пользователя
      const command = await vscode.window.showInputBox({
        prompt: 'Введите команду для выполнения задачи',
        placeHolder: 'Например: Выполнить задачу 123 или Выполнить задачу "Название задачи"',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Команда не может быть пустой';
          }
          if (value.length > 200) {
            return 'Команда слишком длинная';
          }
          return null;
        }
      });

      if (!command) {
        return; // Пользователь отменил ввод
      }

      await this.executeWithProgress(command);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Ошибка выполнения команды: ${errorMessage}`);
    }
  }

  private async executeTaskByIdCommand(): Promise<void> {
    try {
      // Запрос ID задачи у пользователя
      const taskId = await vscode.window.showInputBox({
        prompt: 'Введите ID задачи для выполнения',
        placeHolder: 'Например: 123',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'ID задачи не может быть пустым';
          }
          if (!/^\d+$/.test(value.trim())) {
            return 'ID должен содержать только цифры';
          }
          return null;
        }
      });

      if (!taskId) {
        return; // Пользователь отменил ввод
      }

      const command = `Выполнить задачу ${taskId.trim()}`;
      await this.executeWithProgress(command);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Ошибка выполнения задачи: ${errorMessage}`);
    }
  }

  private async executeWithProgress(command: string): Promise<void> {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Выполнение задачи",
      cancellable: true
    }, async (progress, token) => {
      
      progress.report({ increment: 0, message: "Инициализация..." });

      // Проверка отмены
      if (token.isCancellationRequested) {
        return;
      }

      progress.report({ increment: 20, message: "Поиск задачи..." });

      try {
        const result = await this.executionService.executeTask(command);

        progress.report({ increment: 50, message: "Выполнение задачи..." });

        if (token.isCancellationRequested) {
          return;
        }

        progress.report({ increment: 100, message: "Завершение..." });

        // Показ результата
        if (result.success) {
          vscode.window.showInformationMessage(
            `✅ Задача выполнена успешно: ${result.context.selectedTask.title}`,
            'Показать детали'
          ).then(selection => {
            if (selection === 'Показать детали') {
              this.showExecutionDetails(result);
            }
          });
        } else {
          vscode.window.showErrorMessage(
            `❌ Ошибка выполнения задачи: ${result.error}`,
            'Показать детали'
          ).then(selection => {
            if (selection === 'Показать детали') {
              this.showExecutionDetails(result);
            }
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Критическая ошибка: ${errorMessage}`);
      }
    });
  }

  private async showExecutionHistoryCommand(): Promise<void> {
    const history = this.executionService.getExecutionHistory();
    
    if (history.length === 0) {
      vscode.window.showInformationMessage('История выполнения задач пуста');
      return;
    }

    const items = history.map((result, index) => ({
      label: `${result.success ? '✅' : '❌'} ${result.context.selectedTask.title || 'Unknown Task'}`,
      description: `${result.executionTime}ms - ${result.context.strategy}`,
      detail: result.success ? 'Успешно выполнена' : `Ошибка: ${result.error}`,
      result
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Выберите выполнение для просмотра деталей'
    });

    if (selected) {
      this.showExecutionDetails(selected.result);
    }
  }

  private async showExecutionMetricsCommand(): Promise<void> {
    const metrics = this.executionService.getMetrics();
    
    const message = `
📊 Метрики выполнения задач:

• Всего выполнений: ${metrics.totalExecutions}
• Успешных: ${metrics.successfulExecutions}
• Неудачных: ${metrics.failedExecutions}
• Среднее время: ${Math.round(metrics.averageExecutionTime)}ms

🎯 Стратегии:
${Object.entries(metrics.strategiesUsed)
  .filter(([_, count]) => count > 0)
  .map(([strategy, count]) => `• ${strategy}: ${count}`)
  .join('\n')}

${Object.keys(metrics.commonErrors).length > 0 ? 
  `⚠️ Частые ошибки:\n${Object.entries(metrics.commonErrors)
    .map(([error, count]) => `• ${error}: ${count}`)
    .join('\n')}` : ''}
    `.trim();

    vscode.window.showInformationMessage(message, { modal: true });
  }

  private showExecutionDetails(result: any): void {
    const panel = vscode.window.createWebviewPanel(
      'taskExecutionDetails',
      'Детали выполнения задачи',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.getExecutionDetailsHtml(result);
  }

  private getExecutionDetailsHtml(result: any): string {
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Детали выполнения</title>
    <style>
        body { font-family: var(--vscode-font-family); padding: 20px; }
        .header { border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 10px; }
        .status { font-weight: bold; }
        .success { color: var(--vscode-terminal-ansiGreen); }
        .error { color: var(--vscode-terminal-ansiRed); }
        .section { margin: 20px 0; }
        .step { margin: 5px 0; padding: 5px; background: var(--vscode-editor-background); }
        .log { font-family: monospace; background: var(--vscode-terminal-background); padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h2>${result.context.selectedTask.title}</h2>
        <div class="status ${result.success ? 'success' : 'error'}">
            ${result.success ? '✅ Успешно выполнена' : '❌ Выполнение неудачно'}
        </div>
    </div>

    <div class="section">
        <h3>Информация о задаче</h3>
        <p><strong>ID:</strong> ${result.context.selectedTask.id}</p>
        <p><strong>Описание:</strong> ${result.context.selectedTask.description}</p>
        <p><strong>Приоритет:</strong> ${result.context.selectedTask.priority}</p>
        <p><strong>Статус:</strong> ${result.context.selectedTask.status}</p>
        <p><strong>Стратегия:</strong> ${result.context.strategy}</p>
    </div>

    <div class="section">
        <h3>Выполнение</h3>
        <p><strong>Время выполнения:</strong> ${result.executionTime}ms</p>
        <p><strong>Команда:</strong> ${result.context.command.originalCommand}</p>
        ${result.error ? `<p class="error"><strong>Ошибка:</strong> ${result.error}</p>` : ''}
    </div>

    ${result.steps && result.steps.length > 0 ? `
    <div class="section">
        <h3>Шаги выполнения</h3>
        ${result.steps.map((step: any) => `
            <div class="step">
                <strong>${step.name}</strong> - ${step.status}
                ${step.error ? `<br><span class="error">Ошибка: ${step.error}</span>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${result.logs && result.logs.length > 0 ? `
    <div class="section">
        <h3>Логи</h3>
        <div class="log">
            ${result.logs.join('<br>')}
        </div>
    </div>
    ` : ''}
</body>
</html>
    `;
  }
} 