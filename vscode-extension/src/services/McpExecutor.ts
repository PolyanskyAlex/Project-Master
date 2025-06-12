import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { 
    McpFile, 
    McpInstruction, 
    McpExecutionContext, 
    McpExecutionResult, 
    McpExecutionOptions,
    McpCondition,
    McpAction
} from '../types/mcp';
import { Logger } from '../utils/Logger';
import { IApiService } from '../interfaces/IApiService';

/**
 * Исполнитель .mcp инструкций
 */
export class McpExecutor {
    private logger: Logger;
    private apiService: IApiService;

    constructor(apiService: IApiService) {
        this.logger = new Logger();
        this.apiService = apiService;
    }

    /**
     * Выполнение .mcp файла
     */
    public async execute(
        mcpFile: McpFile, 
        options: McpExecutionOptions = {}
    ): Promise<McpExecutionResult> {
        const startTime = Date.now();
        const context: McpExecutionContext = {
            variables: { ...mcpFile.variables },
            results: {},
            errors: [],
            warnings: []
        };

        const result: McpExecutionResult = {
            success: false,
            executedInstructions: 0,
            skippedInstructions: 0,
            errors: [],
            warnings: [],
            results: {},
            executionTime: 0
        };

        this.logger.info(`Начало выполнения .mcp файла: ${mcpFile.name}`);

        // Подтверждение выполнения
        if (options.confirmBeforeExecution) {
            const confirm = await vscode.window.showWarningMessage(
                `Выполнить .mcp файл "${mcpFile.name}"?\n\nИнструкций: ${mcpFile.instructions.length}`,
                { modal: true },
                'Выполнить',
                'Отмена'
            );

            if (confirm !== 'Выполнить') {
                this.logger.info('Выполнение отменено пользователем');
                result.success = false;
                return result;
            }
        }

        // Dry run режим
        if (options.dryRun) {
            this.logger.info('Режим Dry Run - инструкции не будут выполнены');
            await vscode.window.showInformationMessage(
                `Dry Run: ${mcpFile.name}\n\nИнструкций для выполнения: ${mcpFile.instructions.length}`
            );
        }

        // Выполнение инструкций
        for (let i = 0; i < mcpFile.instructions.length; i++) {
            const instruction = mcpFile.instructions[i];
            
            try {
                // Проверка условий
                if (instruction.conditions && !this.evaluateConditions(instruction.conditions, context)) {
                    this.logger.info(`Инструкция ${instruction.id} пропущена (условия не выполнены)`);
                    result.skippedInstructions++;
                    continue;
                }

                // Выполнение инструкции
                if (!options.dryRun) {
                    const instructionResult = await this.executeInstruction(instruction, context);
                    context.results[instruction.id] = instructionResult;
                    
                    // Выполнение действий при успехе
                    if (instruction.onSuccess) {
                        await this.executeActions(instruction.onSuccess, context);
                    }
                }

                result.executedInstructions++;
                this.logger.info(`Инструкция ${instruction.id} выполнена успешно`);

                // Показ прогресса
                if (mcpFile.instructions.length > 5) {
                    const progress = Math.round((i + 1) / mcpFile.instructions.length * 100);
                    vscode.window.setStatusBarMessage(
                        `Выполнение .mcp: ${progress}% (${i + 1}/${mcpFile.instructions.length})`,
                        2000
                    );
                }

            } catch (error) {
                const errorMessage = `Ошибка в инструкции ${instruction.id}: ${error}`;
                this.logger.error(errorMessage, error);
                result.errors.push(errorMessage);
                context.errors.push(errorMessage);

                // Выполнение действий при ошибке
                if (instruction.onError) {
                    try {
                        await this.executeActions(instruction.onError, context);
                    } catch (actionError) {
                        this.logger.error(`Ошибка в onError действии: ${actionError}`);
                    }
                }

                // Остановка при ошибке
                if (options.stopOnError) {
                    this.logger.error('Выполнение остановлено из-за ошибки');
                    break;
                }
            }

            // Таймаут
            if (options.timeout && (Date.now() - startTime) > options.timeout) {
                const timeoutMessage = 'Превышен таймаут выполнения';
                this.logger.error(timeoutMessage);
                result.errors.push(timeoutMessage);
                break;
            }
        }

        // Финализация результата
        result.executionTime = Date.now() - startTime;
        result.success = result.errors.length === 0;
        result.results = context.results;
        result.warnings = context.warnings;

        this.logger.info(`Выполнение завершено. Успех: ${result.success}, Время: ${result.executionTime}мс`);

        // Показ результата
        if (result.success) {
            vscode.window.showInformationMessage(
                `✅ .mcp файл выполнен успешно!\n\nВыполнено: ${result.executedInstructions}, Пропущено: ${result.skippedInstructions}`
            );
        } else {
            vscode.window.showErrorMessage(
                `❌ Ошибки при выполнении .mcp файла!\n\nОшибок: ${result.errors.length}`
            );
        }

        return result;
    }

    /**
     * Выполнение отдельной инструкции
     */
    private async executeInstruction(instruction: McpInstruction, context: McpExecutionContext): Promise<any> {
        const parameters = this.processParameters(instruction.parameters, context);
        
        switch (instruction.type) {
            // Операции с проектами
            case 'project.create':
                return await vscode.commands.executeCommand('projectMaster.projects.create');
            case 'project.update':
                return await this.executeProjectUpdate(parameters);
            case 'project.delete':
                return await this.executeProjectDelete(parameters);
            case 'project.select':
                return await this.executeProjectSelect(parameters);
            case 'project.export':
                return await vscode.commands.executeCommand('projectMaster.projects.export');

            // Операции с задачами
            case 'task.create':
                return await vscode.commands.executeCommand('projectMaster.tasks.create');
            case 'task.update':
                return await this.executeTaskUpdate(parameters);
            case 'task.delete':
                return await this.executeTaskDelete(parameters);
            case 'task.changeStatus':
                return await this.executeTaskChangeStatus(parameters);
            case 'task.changePriority':
                return await this.executeTaskChangePriority(parameters);
            case 'task.assign':
                return await this.executeTaskAssign(parameters);
            case 'task.addComment':
                return await this.executeTaskAddComment(parameters);
            case 'task.export':
                return await vscode.commands.executeCommand('projectMaster.tasks.export');

            // Операции с планом
            case 'plan.sync':
                return await this.executePlanSync();
            case 'plan.addTask':
                return await this.executePlanAddTask(parameters);
            case 'plan.removeTask':
                return await this.executePlanRemoveTask(parameters);
            case 'plan.reorder':
                return await this.executePlanReorder(parameters);

            // Операции с комментариями
            case 'comment.add':
                return await vscode.commands.executeCommand('projectMaster.comments.add');
            case 'comment.update':
                return await this.executeCommentUpdate(parameters);
            case 'comment.delete':
                return await this.executeCommentDelete(parameters);
            case 'comment.reply':
                return await this.executeCommentReply(parameters);

            // Системные операции
            case 'system.refresh':
                return await this.executeSystemRefresh();
            case 'system.notification':
                return await this.executeSystemNotification(parameters);
            case 'system.log':
                return await this.executeSystemLog(parameters);
            case 'system.wait':
                return await this.executeSystemWait(parameters);

            // Операции с файлами
            case 'file.read':
                return await this.executeFileRead(parameters);
            case 'file.write':
                return await this.executeFileWrite(parameters);
            case 'file.delete':
                return await this.executeFileDelete(parameters);
            case 'file.copy':
                return await this.executeFileCopy(parameters);

            // Операции с IDE
            case 'ide.openFile':
                return await this.executeIdeOpenFile(parameters);
            case 'ide.showMessage':
                return await this.executeIdeShowMessage(parameters);
            case 'ide.executeCommand':
                return await this.executeIdeCommand(parameters);
            case 'ide.openWebview':
                return await this.executeIdeOpenWebview(parameters);

            default:
                throw new Error(`Неподдерживаемый тип инструкции: ${instruction.type}`);
        }
    }

    /**
     * Оценка условий
     */
    private evaluateConditions(conditions: McpCondition[], context: McpExecutionContext): boolean {
        let result = true;
        let operator: 'and' | 'or' = 'and';

        for (const condition of conditions) {
            const conditionResult = this.evaluateCondition(condition, context);
            
            if (operator === 'and') {
                result = result && conditionResult;
            } else {
                result = result || conditionResult;
            }

            operator = condition.operator || 'and';
        }

        return result;
    }

    private evaluateCondition(condition: McpCondition, context: McpExecutionContext): boolean {
        const fieldValue = this.getFieldValue(condition.field, context);
        
        switch (condition.type) {
            case 'equals':
                return fieldValue === condition.value;
            case 'notEquals':
                return fieldValue !== condition.value;
            case 'contains':
                return String(fieldValue).includes(String(condition.value));
            case 'notContains':
                return !String(fieldValue).includes(String(condition.value));
            case 'exists':
                return fieldValue !== undefined && fieldValue !== null;
            case 'notExists':
                return fieldValue === undefined || fieldValue === null;
            case 'greaterThan':
                return Number(fieldValue) > Number(condition.value);
            case 'lessThan':
                return Number(fieldValue) < Number(condition.value);
            default:
                return false;
        }
    }

    private getFieldValue(field: string, context: McpExecutionContext): any {
        const parts = field.split('.');
        let value: any = context;

        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * Выполнение действий
     */
    private async executeActions(actions: McpAction[], context: McpExecutionContext): Promise<void> {
        for (const action of actions) {
            const instruction: McpInstruction = {
                id: `action-${Date.now()}`,
                type: action.type,
                parameters: action.parameters
            };
            
            await this.executeInstruction(instruction, context);
        }
    }

    /**
     * Обработка параметров с заменой переменных
     */
    private processParameters(parameters: Record<string, any>, context: McpExecutionContext): Record<string, any> {
        const processed: Record<string, any> = {};
        
        for (const [key, value] of Object.entries(parameters)) {
            if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
                const variableName = value.slice(2, -2);
                processed[key] = context.variables[variableName] || value;
            } else {
                processed[key] = value;
            }
        }
        
        return processed;
    }

    // Реализация специфичных операций
    private async executeProjectUpdate(parameters: any): Promise<any> {
        this.logger.info('Выполнение project.update', parameters);
        return { success: true };
    }

    private async executeProjectDelete(parameters: any): Promise<any> {
        this.logger.info('Выполнение project.delete', parameters);
        return { success: true };
    }

    private async executeProjectSelect(parameters: any): Promise<any> {
        this.logger.info('Выполнение project.select', parameters);
        return { success: true };
    }

    private async executeTaskUpdate(parameters: any): Promise<any> {
        this.logger.info('Выполнение task.update', parameters);
        return { success: true };
    }

    private async executeTaskDelete(parameters: any): Promise<any> {
        this.logger.info('Выполнение task.delete', parameters);
        return { success: true };
    }

    private async executeTaskChangeStatus(parameters: any): Promise<any> {
        this.logger.info('Выполнение task.changeStatus', parameters);
        return { success: true };
    }

    private async executeTaskChangePriority(parameters: any): Promise<any> {
        this.logger.info('Выполнение task.changePriority', parameters);
        return { success: true };
    }

    private async executeTaskAssign(parameters: any): Promise<any> {
        this.logger.info('Выполнение task.assign', parameters);
        return { success: true };
    }

    private async executeTaskAddComment(parameters: any): Promise<any> {
        this.logger.info('Выполнение task.addComment', parameters);
        return { success: true };
    }

    private async executePlanSync(): Promise<any> {
        this.logger.info('Выполнение plan.sync');
        await vscode.commands.executeCommand('projectMaster.syncPlan');
        return { success: true };
    }

    private async executePlanAddTask(parameters: any): Promise<any> {
        this.logger.info('Выполнение plan.addTask', parameters);
        return { success: true };
    }

    private async executePlanRemoveTask(parameters: any): Promise<any> {
        this.logger.info('Выполнение plan.removeTask', parameters);
        return { success: true };
    }

    private async executePlanReorder(parameters: any): Promise<any> {
        this.logger.info('Выполнение plan.reorder', parameters);
        return { success: true };
    }

    private async executeCommentUpdate(parameters: any): Promise<any> {
        this.logger.info('Выполнение comment.update', parameters);
        return { success: true };
    }

    private async executeCommentDelete(parameters: any): Promise<any> {
        this.logger.info('Выполнение comment.delete', parameters);
        return { success: true };
    }

    private async executeCommentReply(parameters: any): Promise<any> {
        this.logger.info('Выполнение comment.reply', parameters);
        return { success: true };
    }

    private async executeSystemRefresh(): Promise<any> {
        this.logger.info('Выполнение system.refresh');
        await vscode.commands.executeCommand('projectMaster.refreshAll');
        return { success: true };
    }

    private async executeSystemNotification(parameters: any): Promise<any> {
        const { type = 'info', message } = parameters;
        
        switch (type) {
            case 'info':
                await vscode.window.showInformationMessage(message);
                break;
            case 'warning':
                await vscode.window.showWarningMessage(message);
                break;
            case 'error':
                await vscode.window.showErrorMessage(message);
                break;
        }
        
        return { success: true };
    }

    private async executeSystemLog(parameters: any): Promise<any> {
        const { level = 'info', message } = parameters;
        
        switch (level) {
            case 'debug':
                this.logger.debug(message);
                break;
            case 'info':
                this.logger.info(message);
                break;
            case 'warn':
                this.logger.warn(message);
                break;
            case 'error':
                this.logger.error(message);
                break;
        }
        
        return { success: true };
    }

    private async executeSystemWait(parameters: any): Promise<any> {
        const { duration = 1000 } = parameters;
        await new Promise(resolve => setTimeout(resolve, duration));
        return { success: true };
    }

    private async executeFileRead(parameters: any): Promise<any> {
        const { path: filePath } = parameters;
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`Файл не найден: ${filePath}`);
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        return { content, path: filePath };
    }

    private async executeFileWrite(parameters: any): Promise<any> {
        const { path: filePath, content } = parameters;
        
        fs.writeFileSync(filePath, content, 'utf8');
        return { success: true, path: filePath };
    }

    private async executeFileDelete(parameters: any): Promise<any> {
        const { path: filePath } = parameters;
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        return { success: true, path: filePath };
    }

    private async executeFileCopy(parameters: any): Promise<any> {
        const { source, destination } = parameters;
        
        if (!fs.existsSync(source)) {
            throw new Error(`Исходный файл не найден: ${source}`);
        }
        
        fs.copyFileSync(source, destination);
        return { success: true, source, destination };
    }

    private async executeIdeOpenFile(parameters: any): Promise<any> {
        const { path: filePath } = parameters;
        
        const uri = vscode.Uri.file(filePath);
        await vscode.window.showTextDocument(uri);
        
        return { success: true, path: filePath };
    }

    private async executeIdeShowMessage(parameters: any): Promise<any> {
        const { type = 'info', message } = parameters;
        
        switch (type) {
            case 'info':
                await vscode.window.showInformationMessage(message);
                break;
            case 'warning':
                await vscode.window.showWarningMessage(message);
                break;
            case 'error':
                await vscode.window.showErrorMessage(message);
                break;
        }
        
        return { success: true };
    }

    private async executeIdeCommand(parameters: any): Promise<any> {
        const { command, args = [] } = parameters;
        
        await vscode.commands.executeCommand(command, ...args);
        return { success: true, command };
    }

    private async executeIdeOpenWebview(parameters: any): Promise<any> {
        const { url } = parameters;
        
        await vscode.env.openExternal(vscode.Uri.parse(url));
        return { success: true, url };
    }
} 