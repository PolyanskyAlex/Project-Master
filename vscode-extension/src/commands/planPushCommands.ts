import * as vscode from 'vscode';
import { PlanPushService } from '../services/PlanPushService';
import { ApiService } from '../services/ApiService';
import { ConfigurationService } from '../services/ConfigurationService';
import { Logger } from '../utils/Logger';

/**
 * Команды для "пуш" функционала работы с планом разработки
 */
export class PlanPushCommands {
    private planPushService: PlanPushService;
    private logger: Logger;

    constructor(
        private context: vscode.ExtensionContext,
        configService: ConfigurationService
    ) {
        this.logger = new Logger();
        const apiService = new ApiService(configService, this.logger);
        this.planPushService = new PlanPushService(apiService);
    }

    /**
     * Регистрация всех команд
     */
    public registerCommands(): void {
        const commands = [
            vscode.commands.registerCommand('projectMaster.pushTaskToPlan', () => this.pushTaskToPlan()),
            vscode.commands.registerCommand('projectMaster.createTasksFromTodos', () => this.createTasksFromTodos()),
            vscode.commands.registerCommand('projectMaster.exportPlan', () => this.exportPlan()),
            vscode.commands.registerCommand('projectMaster.pushCurrentContext', () => this.pushCurrentContext()),
            vscode.commands.registerCommand('projectMaster.quickAddTask', () => this.quickAddTask())
        ];

        commands.forEach(command => {
            this.context.subscriptions.push(command);
        });

        this.logger.info('Plan push commands registered');
    }

    /**
     * Добавление текущей задачи в план разработки
     */
    private async pushTaskToPlan(): Promise<void> {
        try {
            await this.planPushService.pushCurrentTaskToPlan();
        } catch (error) {
            this.logger.error('Error in pushTaskToPlan command:', error);
            vscode.window.showErrorMessage(`Failed to push task to plan: ${error}`);
        }
    }

    /**
     * Создание задач из TODO комментариев
     */
    private async createTasksFromTodos(): Promise<void> {
        try {
            await this.planPushService.createTasksFromTodos();
        } catch (error) {
            this.logger.error('Error in createTasksFromTodos command:', error);
            vscode.window.showErrorMessage(`Failed to create tasks from TODOs: ${error}`);
        }
    }

    /**
     * Экспорт плана разработки
     */
    private async exportPlan(): Promise<void> {
        try {
            await this.planPushService.exportPlanToFile();
        } catch (error) {
            this.logger.error('Error in exportPlan command:', error);
            vscode.window.showErrorMessage(`Failed to export plan: ${error}`);
        }
    }

    /**
     * Быстрое добавление контекста в план
     */
    private async pushCurrentContext(): Promise<void> {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showWarningMessage('No active file to push context from.');
                return;
            }

            // Показать меню быстрых действий
            const action = await vscode.window.showQuickPick([
                {
                    label: '$(plus) Add as New Task',
                    description: 'Create a new task from current context',
                    detail: 'Creates a task with current file and selection context',
                    action: 'newTask'
                },
                {
                    label: '$(search) Find TODOs',
                    description: 'Scan workspace for TODO comments',
                    detail: 'Automatically create tasks from TODO comments',
                    action: 'findTodos'
                },
                {
                    label: '$(export) Export Plan',
                    description: 'Export development plan to file',
                    detail: 'Save plan as Markdown, JSON, or CSV',
                    action: 'export'
                }
            ], {
                placeHolder: 'Select action for current context',
                matchOnDescription: true
            });

            if (!action) {
                return;
            }

            switch (action.action) {
                case 'newTask':
                    await this.planPushService.pushCurrentTaskToPlan();
                    break;
                case 'findTodos':
                    await this.planPushService.createTasksFromTodos();
                    break;
                case 'export':
                    await this.planPushService.exportPlanToFile();
                    break;
            }

        } catch (error) {
            this.logger.error('Error in pushCurrentContext command:', error);
            vscode.window.showErrorMessage(`Failed to push context: ${error}`);
        }
    }

    /**
     * Быстрое добавление задачи
     */
    private async quickAddTask(): Promise<void> {
        try {
            // Упрощенный интерфейс для быстрого добавления задачи
            const taskTitle = await vscode.window.showInputBox({
                prompt: 'Enter task title',
                placeHolder: 'What needs to be done?',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Task title is required';
                    }
                    return null;
                }
            });

            if (!taskTitle) {
                return;
            }

            // Использовать существующий метод
            await this.planPushService.pushCurrentTaskToPlan();

        } catch (error) {
            this.logger.error('Error in quickAddTask command:', error);
            vscode.window.showErrorMessage(`Failed to add quick task: ${error}`);
        }
    }
}
