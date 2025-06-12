import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ApiService } from './ApiService';
import { Logger } from '../utils/Logger';
import { Task, Project, PlanItem } from '../types';

/**
 * Сервис для "пуш" функционала работы с планом разработки
 */
export class PlanPushService {
    private logger: Logger;

    constructor(private apiService: ApiService) {
        this.logger = new Logger();
    }

    /**
     * Добавление текущей задачи в план разработки
     */
    public async pushCurrentTaskToPlan(): Promise<void> {
        try {
            // Получение информации о текущем файле/контексте
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showWarningMessage('No active file. Please open a file to push to plan.');
                return;
            }

            const fileName = path.basename(activeEditor.document.fileName);
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
            
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('File is not in a workspace. Please open a workspace.');
                return;
            }

            // Анализ контекста для определения задачи
            const taskContext = await this.analyzeFileContext(activeEditor);
            
            // Выбор проекта
            const selectedProject = await this.selectProject();
            if (!selectedProject) {
                return;
            }

            // Создание или обновление задачи
            const task = await this.createOrUpdateTask(taskContext, selectedProject, fileName);
            if (!task) {
                return;
            }

            // Добавление в план
            await this.addTaskToPlan(selectedProject.id, task.id);

            vscode.window.showInformationMessage(
                `Task "${task.title}" added to development plan for project "${selectedProject.name}"`,
                'View Plan',
                'Open Web UI'
            ).then(selection => {
                if (selection === 'View Plan') {
                    vscode.commands.executeCommand('projectMaster.syncPlan');
                } else if (selection === 'Open Web UI') {
                    vscode.commands.executeCommand('projectMaster.openWebUI');
                }
            });

        } catch (error) {
            this.logger.error('Error pushing task to plan:', error);
            vscode.window.showErrorMessage(`Failed to push task to plan: ${error}`);
        }
    }

    /**
     * Автоматическое создание задач на основе TODO комментариев
     */
    public async createTasksFromTodos(): Promise<void> {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('No workspace folder found.');
                return;
            }

            // Поиск TODO комментариев
            const todos = await this.findTodoComments(workspaceFolder.uri.fsPath);
            
            if (todos.length === 0) {
                vscode.window.showInformationMessage('No TODO comments found in workspace.');
                return;
            }

            // Выбор проекта
            const selectedProject = await this.selectProject();
            if (!selectedProject) {
                return;
            }

            // Создание задач из TODO
            const createdTasks: Task[] = [];
            for (const todo of todos) {
                try {
                    const task = await this.createTaskFromTodo(todo, selectedProject);
                    if (task) {
                        createdTasks.push(task);
                        // Добавление в план
                        await this.addTaskToPlan(selectedProject.id, task.id);
                    }
                } catch (error) {
                    this.logger.error(`Failed to create task from TODO: ${todo.text}`, error);
                }
            }

            vscode.window.showInformationMessage(
                `Created ${createdTasks.length} task(s) from TODO comments.`,
                'View Plan',
                'View Tasks'
            ).then(selection => {
                if (selection === 'View Plan') {
                    vscode.commands.executeCommand('projectMaster.syncPlan');
                } else if (selection === 'View Tasks') {
                    vscode.commands.executeCommand('projectMaster.refreshTasks');
                }
            });

        } catch (error) {
            this.logger.error('Error creating tasks from TODOs:', error);
            vscode.window.showErrorMessage(`Failed to create tasks from TODOs: ${error}`);
        }
    }

    /**
     * Экспорт плана разработки в файл
     */
    public async exportPlanToFile(): Promise<void> {
        try {
            // Выбор проекта
            const selectedProject = await this.selectProject();
            if (!selectedProject) {
                return;
            }

            // Получение плана
            const plan = await this.apiService.getPlan(selectedProject.id);
            
            // Выбор формата экспорта
            const format = await vscode.window.showQuickPick([
                { label: 'Markdown', description: 'Export as .md file', value: 'md' },
                { label: 'JSON', description: 'Export as .json file', value: 'json' },
                { label: 'CSV', description: 'Export as .csv file', value: 'csv' }
            ], {
                placeHolder: 'Select export format'
            });

            if (!format) {
                return;
            }

            // Генерация содержимого
            const content = this.generatePlanContent(plan, selectedProject, format.value);
            
            // Выбор места сохранения
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(`${selectedProject.name}-plan.${format.value}`),
                filters: this.getFileFilters(format.value),
                title: 'Export Development Plan'
            });

            if (!saveUri) {
                return;
            }

            // Сохранение файла
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(content, 'utf8'));

            // Открытие файла
            const document = await vscode.workspace.openTextDocument(saveUri);
            await vscode.window.showTextDocument(document);

            vscode.window.showInformationMessage(`Development plan exported: ${path.basename(saveUri.fsPath)}`);

        } catch (error) {
            this.logger.error('Error exporting plan to file:', error);
            vscode.window.showErrorMessage(`Failed to export plan: ${error}`);
        }
    }

    // Приватные методы

    private async analyzeFileContext(editor: vscode.TextEditor): Promise<any> {
        const document = editor.document;
        const selection = editor.selection;
        
        // Получение выделенного текста или текущей строки
        const selectedText = document.getText(selection);
        const currentLine = document.lineAt(selection.active.line).text;
        
        // Анализ контекста
        const context = {
            fileName: path.basename(document.fileName),
            filePath: document.fileName,
            selectedText: selectedText || currentLine,
            language: document.languageId,
            lineNumber: selection.active.line + 1,
            workspaceRelativePath: vscode.workspace.asRelativePath(document.fileName)
        };

        return context;
    }

    private async selectProject(): Promise<Project | null> {
        try {
            const projects = await this.apiService.getProjects();
            
            if (projects.length === 0) {
                vscode.window.showWarningMessage('No projects found. Please create a project first.');
                return null;
            }

            const projectItems = projects.map(project => ({
                label: project.name,
                description: project.description || '',
                detail: `Status: ${project.status}`,
                project: project
            }));

            const selectedProject = await vscode.window.showQuickPick(projectItems, {
                placeHolder: 'Select project for the task',
                matchOnDescription: true
            });

            return selectedProject?.project || null;
        } catch (error) {
            this.logger.error('Error selecting project:', error);
            return null;
        }
    }

    private async createOrUpdateTask(context: any, project: Project, fileName: string): Promise<Task | null> {
        // Генерация заголовка задачи на основе контекста
        let title = `Work on ${fileName}`;
        if (context.selectedText && context.selectedText.length < 100) {
            title = context.selectedText.trim();
        }

        // Запрос дополнительной информации у пользователя
        const taskTitle = await vscode.window.showInputBox({
            prompt: 'Enter task title',
            value: title,
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Task title is required';
                }
                return null;
            }
        });

        if (!taskTitle) {
            return null;
        }

        const taskDescription = await vscode.window.showInputBox({
            prompt: 'Enter task description (optional)',
            value: `File: ${context.workspaceRelativePath}\nLine: ${context.lineNumber}\n\nContext: ${context.selectedText}`
        });

        // Выбор типа задачи
        const taskType = await vscode.window.showQuickPick([
            { label: 'Новый функционал', value: 'feature' },
            { label: 'Исправление ошибки', value: 'bug' },
            { label: 'Улучшение', value: 'improvement' },
            { label: 'Документация', value: 'documentation' },
            { label: 'Тестирование', value: 'test' }
        ], {
            placeHolder: 'Select task type'
        });

        if (!taskType) {
            return null;
        }

        // Выбор приоритета
        const priority = await vscode.window.showQuickPick([
            { label: 'Критический', value: 'critical' },
            { label: 'Высокий', value: 'high' },
            { label: 'Средний', value: 'medium' },
            { label: 'Низкий', value: 'low' }
        ], {
            placeHolder: 'Select task priority'
        });

        if (!priority) {
            return null;
        }

        try {
            const task = await this.apiService.createTask({
                title: taskTitle,
                description: taskDescription || '',
                project_id: project.id,
                type: taskType.value as 'feature' | 'bug' | 'improvement' | 'documentation' | 'test',
                priority: priority.value as 'low' | 'medium' | 'high' | 'critical'
            });

            return task;
        } catch (error) {
            this.logger.error('Error creating task:', error);
            vscode.window.showErrorMessage(`Failed to create task: ${error}`);
            return null;
        }
    }

    private async addTaskToPlan(projectId: string, taskId: string): Promise<void> {
        try {
            await this.apiService.addTaskToPlan(projectId, taskId);
        } catch (error) {
            this.logger.error('Error adding task to plan:', error);
            throw error;
        }
    }

    private async findTodoComments(workspacePath: string): Promise<Array<{text: string, file: string, line: number}>> {
        const todos: Array<{text: string, file: string, line: number}> = [];
        
        // Поиск TODO комментариев в рабочей области
        const files = await vscode.workspace.findFiles('**/*.{ts,js,py,go,java,cpp,c,h}', '**/node_modules/**');
        
        for (const file of files) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                const text = document.getText();
                const lines = text.split('\n');
                
                lines.forEach((line, index) => {
                    const todoMatch = line.match(/\/\/\s*TODO:?\s*(.+)/i) || line.match(/#\s*TODO:?\s*(.+)/i);
                    if (todoMatch) {
                        todos.push({
                            text: todoMatch[1].trim(),
                            file: vscode.workspace.asRelativePath(file),
                            line: index + 1
                        });
                    }
                });
            } catch (error) {
                this.logger.error(`Error reading file ${file.fsPath}:`, error);
            }
        }
        
        return todos;
    }

    private async createTaskFromTodo(todo: {text: string, file: string, line: number}, project: Project): Promise<Task | null> {
        try {
            const task = await this.apiService.createTask({
                title: todo.text,
                description: `TODO from ${todo.file}:${todo.line}\n\n${todo.text}`,
                project_id: project.id,
                type: 'feature',
                priority: 'medium'
            });

            return task;
        } catch (error) {
            this.logger.error('Error creating task from TODO:', error);
            return null;
        }
    }

    private generatePlanContent(plan: PlanItem[], project: Project, format: string): string {
        switch (format) {
            case 'md':
                return this.generateMarkdownPlan(plan, project);
            case 'json':
                return JSON.stringify(plan, null, 2);
            case 'csv':
                return this.generateCsvPlan(plan);
            default:
                return JSON.stringify(plan, null, 2);
        }
    }

    private generateMarkdownPlan(plan: PlanItem[], project: Project): string {
        let content = `# Development Plan: ${project.name}\n\n`;
        content += `**Project Status:** ${project.status}\n`;
        content += `**Total Tasks:** ${plan?.length || 0}\n\n`;
        
        if (plan && plan.length > 0) {
            content += `## Tasks\n\n`;
            plan.forEach((item: PlanItem, index: number) => {
                content += `### ${index + 1}. ${item.task?.title || 'Unknown Task'}\n\n`;
                content += `- **ID:** ${item.task_id}\n`;
                content += `- **Status:** ${item.task?.status || 'Unknown'}\n`;
                content += `- **Priority:** ${item.task?.priority || 'Unknown'}\n`;
                content += `- **Type:** ${item.task?.type || 'Unknown'}\n\n`;
                if (item.task?.description) {
                    content += `**Description:**\n${item.task.description}\n\n`;
                }
                content += `---\n\n`;
            });
        }
        
        content += `\n*Generated on ${new Date().toLocaleString()}*\n`;
        return content;
    }

    private generateCsvPlan(plan: PlanItem[]): string {
        let csv = 'ID,Title,Status,Priority,Type,Description\n';
        
        if (plan) {
            plan.forEach((item: PlanItem) => {
                const description = (item.task?.description || '').replace(/"/g, '""');
                csv += `"${item.task_id}","${item.task?.title || ''}","${item.task?.status || ''}","${item.task?.priority || ''}","${item.task?.type || ''}","${description}"\n`;
            });
        }
        
        return csv;
    }

    private getFileFilters(format: string): Record<string, string[]> {
        switch (format) {
            case 'md':
                return { 'Markdown Files': ['md'], 'All Files': ['*'] };
            case 'json':
                return { 'JSON Files': ['json'], 'All Files': ['*'] };
            case 'csv':
                return { 'CSV Files': ['csv'], 'All Files': ['*'] };
            default:
                return { 'All Files': ['*'] };
        }
    }
}
