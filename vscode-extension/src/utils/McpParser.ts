import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { McpFile, McpInstruction, McpValidationResult, McpTemplate } from '../types/mcp';
import { Logger } from './Logger';

/**
 * Парсер и валидатор .mcp файлов
 */
export class McpParser {
    private logger: Logger;

    constructor() {
        this.logger = new Logger();
    }

    /**
     * Парсинг .mcp файла из строки
     */
    public parseFromString(content: string): McpFile | null {
        try {
            // Удаляем комментарии (строки начинающиеся с //)
            const cleanContent = content
                .split('\n')
                .filter(line => !line.trim().startsWith('//'))
                .join('\n');

            const parsed = JSON.parse(cleanContent);
            
            // Валидация базовой структуры
            if (!this.isValidMcpStructure(parsed)) {
                this.logger.error('Неверная структура .mcp файла');
                return null;
            }

            return parsed as McpFile;
        } catch (error) {
            this.logger.error('Ошибка парсинга .mcp файла:', error);
            return null;
        }
    }

    /**
     * Парсинг .mcp файла из файловой системы
     */
    public async parseFromFile(filePath: string): Promise<McpFile | null> {
        try {
            if (!fs.existsSync(filePath)) {
                this.logger.error(`Файл не найден: ${filePath}`);
                return null;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const mcpFile = this.parseFromString(content);
            
            if (mcpFile) {
                this.logger.info(`Успешно загружен .mcp файл: ${path.basename(filePath)}`);
            }

            return mcpFile;
        } catch (error) {
            this.logger.error('Ошибка чтения .mcp файла:', error);
            return null;
        }
    }

    /**
     * Валидация .mcp файла
     */
    public validate(mcpFile: McpFile): McpValidationResult {
        const result: McpValidationResult = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Проверка обязательных полей
        if (!mcpFile.version) {
            result.errors.push('Отсутствует поле "version"');
        }

        if (!mcpFile.name) {
            result.errors.push('Отсутствует поле "name"');
        }

        if (!mcpFile.instructions || !Array.isArray(mcpFile.instructions)) {
            result.errors.push('Отсутствует или неверное поле "instructions"');
        } else {
            // Валидация инструкций
            mcpFile.instructions.forEach((instruction, index) => {
                const instructionErrors = this.validateInstruction(instruction, index);
                result.errors.push(...instructionErrors);
            });
        }

        // Проверка версии
        if (mcpFile.version && !this.isValidVersion(mcpFile.version)) {
            result.warnings.push(`Неподдерживаемая версия: ${mcpFile.version}`);
        }

        // Проверка дублирующихся ID инструкций
        if (mcpFile.instructions) {
            const ids = mcpFile.instructions.map(i => i.id);
            const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
            if (duplicates.length > 0) {
                result.errors.push(`Дублирующиеся ID инструкций: ${duplicates.join(', ')}`);
            }
        }

        result.valid = result.errors.length === 0;
        return result;
    }

    /**
     * Поиск .mcp файлов в рабочей области
     */
    public async findMcpFiles(): Promise<string[]> {
        const mcpFiles: string[] = [];
        
        if (!vscode.workspace.workspaceFolders) {
            return mcpFiles;
        }

        for (const folder of vscode.workspace.workspaceFolders) {
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(folder, '**/*.mcp'),
                '**/node_modules/**'
            );
            
            mcpFiles.push(...files.map(file => file.fsPath));
        }

        this.logger.info(`Найдено .mcp файлов: ${mcpFiles.length}`);
        return mcpFiles;
    }

    /**
     * Создание .mcp файла из шаблона
     */
    public createFromTemplate(template: McpTemplate, variables?: Record<string, any>): string {
        const mcpFile = { ...template.content };
        
        // Замена переменных
        if (variables) {
            mcpFile.variables = { ...mcpFile.variables, ...variables };
        }

        // Замена переменных в инструкциях
        const content = JSON.stringify(mcpFile, null, 2);
        const processedContent = this.replaceVariables(content, mcpFile.variables || {});
        
        return processedContent;
    }

    /**
     * Получение предустановленных шаблонов
     */
    public getTemplates(): McpTemplate[] {
        return [
            {
                id: 'create-project-with-tasks',
                name: 'Создание проекта с задачами',
                description: 'Создает новый проект и добавляет базовые задачи',
                category: 'project',
                content: {
                    version: '1.0',
                    name: 'Создание проекта с задачами',
                    description: 'Автоматическое создание проекта и базовых задач',
                    variables: {
                        projectName: 'Новый проект',
                        functionalBlockId: 1,
                        taskCount: 3
                    },
                    instructions: [
                        {
                            id: 'create-project',
                            type: 'project.create',
                            description: 'Создание нового проекта',
                            parameters: {
                                name: '{{projectName}}',
                                description: 'Автоматически созданный проект',
                                functional_block_id: '{{functionalBlockId}}',
                                status: 'planning'
                            }
                        },
                        {
                            id: 'create-task-1',
                            type: 'task.create',
                            description: 'Создание первой задачи',
                            parameters: {
                                title: 'Анализ требований',
                                description: 'Провести анализ требований к проекту',
                                type: 'analysis',
                                priority: 'high',
                                status: 'todo'
                            }
                        }
                    ]
                }
            },
            {
                id: 'daily-maintenance',
                name: 'Ежедневное обслуживание',
                description: 'Выполняет ежедневные задачи обслуживания',
                category: 'maintenance',
                content: {
                    version: '1.0',
                    name: 'Ежедневное обслуживание',
                    instructions: [
                        {
                            id: 'refresh-all',
                            type: 'system.refresh',
                            description: 'Обновление всех данных',
                            parameters: {}
                        },
                        {
                            id: 'sync-plan',
                            type: 'plan.sync',
                            description: 'Синхронизация плана разработки',
                            parameters: {}
                        }
                    ]
                }
            }
        ];
    }

    private isValidMcpStructure(obj: any): boolean {
        return obj && 
               typeof obj === 'object' &&
               typeof obj.version === 'string' &&
               typeof obj.name === 'string' &&
               Array.isArray(obj.instructions);
    }

    private validateInstruction(instruction: McpInstruction, index: number): string[] {
        const errors: string[] = [];

        if (!instruction.id) {
            errors.push(`Инструкция ${index}: отсутствует ID`);
        }

        if (!instruction.type) {
            errors.push(`Инструкция ${index}: отсутствует тип`);
        }

        if (!instruction.parameters || typeof instruction.parameters !== 'object') {
            errors.push(`Инструкция ${index}: отсутствуют или неверные параметры`);
        }

        // Валидация условий
        if (instruction.conditions) {
            instruction.conditions.forEach((condition, condIndex) => {
                if (!condition.type || !condition.field) {
                    errors.push(`Инструкция ${index}, условие ${condIndex}: неверная структура`);
                }
            });
        }

        return errors;
    }

    private isValidVersion(version: string): boolean {
        // Поддерживаемые версии
        const supportedVersions = ['1.0'];
        return supportedVersions.includes(version);
    }

    private replaceVariables(content: string, variables: Record<string, any>): string {
        let result = content;
        
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, String(value));
        }
        
        return result;
    }
} 