import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { McpParser } from '../utils/McpParser';
import { McpExecutor } from '../services/McpExecutor';
import { IApiService } from '../interfaces/IApiService';
import { Logger } from '../utils/Logger';
import { McpFile, McpTemplate } from '../types/mcp';

/**
 * Команды для работы с .mcp файлами
 */
export class McpCommands {
    private parser: McpParser;
    private executor: McpExecutor;
    private logger: Logger;

    constructor(private apiService: IApiService) {
        this.parser = new McpParser();
        this.executor = new McpExecutor(apiService);
        this.logger = new Logger();
    }

    /**
     * Выполнение .mcp файла
     */
    public async executeMcpFile(uri?: vscode.Uri): Promise<void> {
        try {
            let filePath: string;

            if (uri) {
                filePath = uri.fsPath;
            } else {
                // Выбор файла через диалог
                const fileUri = await vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    filters: {
                        'MCP Files': ['mcp'],
                        'All Files': ['*']
                    },
                    title: 'Select MCP file to execute'
                });

                if (!fileUri || fileUri.length === 0) {
                    return;
                }

                filePath = fileUri[0].fsPath;
            }

            // Парсинг файла
            const mcpFile = await this.parser.parseFromFile(filePath);
            if (!mcpFile) {
                vscode.window.showErrorMessage('Failed to parse MCP file');
                return;
            }

            // Валидация
            const validation = this.parser.validate(mcpFile);
            if (!validation.valid) {
                const message = `MCP file validation failed:\n${validation.errors.join('\n')}`;
                vscode.window.showErrorMessage(message);
                return;
            }

            // Показ предупреждений
            if (validation.warnings.length > 0) {
                const warningMessage = `Warnings found:\n${validation.warnings.join('\n')}`;
                vscode.window.showWarningMessage(warningMessage);
            }

            // Опции выполнения
            const options = await this.getExecutionOptions();
            if (!options) {
                return; // Пользователь отменил
            }

            // Выполнение
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Executing MCP: ${mcpFile.name}`,
                cancellable: false
            }, async (progress) => {
                const result = await this.executor.execute(mcpFile, options);
                
                if (result.success) {
                    this.logger.info(`MCP execution completed successfully: ${mcpFile.name}`);
                } else {
                    this.logger.error(`MCP execution failed: ${result.errors.join(', ')}`);
                }
            });

        } catch (error) {
            this.logger.error('Error executing MCP file:', error);
            vscode.window.showErrorMessage(`Error executing MCP file: ${error}`);
        }
    }

    /**
     * Валидация .mcp файла
     */
    public async validateMcpFile(uri?: vscode.Uri): Promise<void> {
        try {
            let filePath: string;

            if (uri) {
                filePath = uri.fsPath;
            } else {
                // Получение активного файла
                const activeEditor = vscode.window.activeTextEditor;
                if (!activeEditor || !activeEditor.document.fileName.endsWith('.mcp')) {
                    vscode.window.showErrorMessage('Please open a .mcp file or select one from the explorer');
                    return;
                }
                filePath = activeEditor.document.fileName;
            }

            // Парсинг и валидация
            const mcpFile = await this.parser.parseFromFile(filePath);
            if (!mcpFile) {
                vscode.window.showErrorMessage('Failed to parse MCP file');
                return;
            }

            const validation = this.parser.validate(mcpFile);
            
            // Показ результатов
            if (validation.valid) {
                let message = '✅ MCP file is valid!';
                if (validation.warnings.length > 0) {
                    message += `\n\n⚠️ Warnings:\n${validation.warnings.join('\n')}`;
                }
                vscode.window.showInformationMessage(message);
            } else {
                let message = `❌ MCP file validation failed:\n\n${validation.errors.join('\n')}`;
                if (validation.warnings.length > 0) {
                    message += `\n\n⚠️ Warnings:\n${validation.warnings.join('\n')}`;
                }
                vscode.window.showErrorMessage(message);
            }

        } catch (error) {
            this.logger.error('Error validating MCP file:', error);
            vscode.window.showErrorMessage(`Error validating MCP file: ${error}`);
        }
    }

    /**
     * Создание .mcp файла из шаблона
     */
    public async createMcpFile(): Promise<void> {
        try {
            // Выбор шаблона
            const templates = this.parser.getTemplates();
            const templateItems = templates.map(template => ({
                label: template.name,
                description: template.description,
                detail: `Category: ${template.category}`,
                template: template
            }));

            const selectedTemplate = await vscode.window.showQuickPick(templateItems, {
                placeHolder: 'Select MCP template',
                matchOnDescription: true,
                matchOnDetail: true
            });

            if (!selectedTemplate) {
                return;
            }

            // Ввод переменных
            const variables: Record<string, any> = {};
            if (selectedTemplate.template.content.variables) {
                for (const [key, defaultValue] of Object.entries(selectedTemplate.template.content.variables)) {
                    const value = await vscode.window.showInputBox({
                        prompt: `Enter value for ${key}`,
                        value: String(defaultValue),
                        placeHolder: `Default: ${defaultValue}`
                    });

                    if (value === undefined) {
                        return; // Пользователь отменил
                    }

                    variables[key] = value;
                }
            }

            // Генерация содержимого
            const content = this.parser.createFromTemplate(selectedTemplate.template, variables);

            // Выбор места сохранения
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(`${selectedTemplate.template.id}.mcp`),
                filters: {
                    'MCP Files': ['mcp'],
                    'All Files': ['*']
                },
                title: 'Save MCP file'
            });

            if (!saveUri) {
                return;
            }

            // Сохранение файла
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(content, 'utf8'));

            // Открытие файла
            const document = await vscode.workspace.openTextDocument(saveUri);
            await vscode.window.showTextDocument(document);

            vscode.window.showInformationMessage(`MCP file created: ${path.basename(saveUri.fsPath)}`);

        } catch (error) {
            this.logger.error('Error creating MCP file:', error);
            vscode.window.showErrorMessage(`Error creating MCP file: ${error}`);
        }
    }

    /**
     * Поиск .mcp файлов в рабочей области
     */
    public async findMcpFiles(): Promise<void> {
        try {
            const mcpFiles = await this.parser.findMcpFiles();

            if (mcpFiles.length === 0) {
                vscode.window.showInformationMessage('No .mcp files found in workspace');
                return;
            }

            // Создание элементов для QuickPick
            const fileItems = mcpFiles.map(filePath => {
                const relativePath = vscode.workspace.asRelativePath(filePath);
                return {
                    label: path.basename(filePath),
                    description: relativePath,
                    detail: filePath,
                    filePath: filePath
                };
            });

            const selectedFile = await vscode.window.showQuickPick(fileItems, {
                placeHolder: `Found ${mcpFiles.length} MCP files. Select one to open:`,
                matchOnDescription: true
            });

            if (selectedFile) {
                const document = await vscode.workspace.openTextDocument(selectedFile.filePath);
                await vscode.window.showTextDocument(document);
            }

        } catch (error) {
            this.logger.error('Error finding MCP files:', error);
            vscode.window.showErrorMessage(`Error finding MCP files: ${error}`);
        }
    }

    /**
     * Получение опций выполнения от пользователя
     */
    private async getExecutionOptions(): Promise<any> {
        const options: any = {};

        // Подтверждение выполнения
        const confirmExecution = await vscode.window.showQuickPick([
            { label: 'Execute', description: 'Run the MCP file', value: true },
            { label: 'Dry Run', description: 'Validate without executing', value: false }
        ], {
            placeHolder: 'Choose execution mode'
        });

        if (!confirmExecution) {
            return null;
        }

        options.dryRun = !confirmExecution.value;
        options.confirmBeforeExecution = true;

        // Остановка при ошибке
        const stopOnError = await vscode.window.showQuickPick([
            { label: 'Continue on error', description: 'Continue executing even if errors occur', value: false },
            { label: 'Stop on error', description: 'Stop execution on first error', value: true }
        ], {
            placeHolder: 'Error handling strategy'
        });

        if (stopOnError) {
            options.stopOnError = stopOnError.value;
        }

        return options;
    }
} 