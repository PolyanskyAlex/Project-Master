/**
 * Типы для работы с .mcp (Master Control Program) файлами
 * Система автоматизации операций в Project Master
 */

export interface McpInstruction {
    id: string;
    type: McpInstructionType;
    description?: string;
    parameters: Record<string, any>;
    conditions?: McpCondition[];
    onSuccess?: McpAction[];
    onError?: McpAction[];
}

export type McpInstructionType = 
    // Операции с проектами
    | 'project.create'
    | 'project.update' 
    | 'project.delete'
    | 'project.select'
    | 'project.export'
    
    // Операции с задачами
    | 'task.create'
    | 'task.update'
    | 'task.delete'
    | 'task.changeStatus'
    | 'task.changePriority'
    | 'task.assign'
    | 'task.addComment'
    | 'task.export'
    
    // Операции с планом
    | 'plan.sync'
    | 'plan.addTask'
    | 'plan.removeTask'
    | 'plan.reorder'
    | 'plan.export'
    
    // Операции с комментариями
    | 'comment.add'
    | 'comment.update'
    | 'comment.delete'
    | 'comment.reply'
    
    // Системные операции
    | 'system.refresh'
    | 'system.backup'
    | 'system.notification'
    | 'system.log'
    | 'system.wait'
    | 'system.condition'
    
    // Операции с файлами
    | 'file.read'
    | 'file.write'
    | 'file.delete'
    | 'file.copy'
    
    // Операции с IDE
    | 'ide.openFile'
    | 'ide.showMessage'
    | 'ide.executeCommand'
    | 'ide.openWebview';

export interface McpCondition {
    type: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'exists' | 'notExists' | 'greaterThan' | 'lessThan';
    field: string;
    value: any;
    operator?: 'and' | 'or';
}

export interface McpAction {
    type: McpInstructionType;
    parameters: Record<string, any>;
}

export interface McpFile {
    version: string;
    name: string;
    description?: string;
    author?: string;
    created?: string;
    variables?: Record<string, any>;
    instructions: McpInstruction[];
}

export interface McpExecutionContext {
    variables: Record<string, any>;
    currentProject?: any;
    currentTask?: any;
    results: Record<string, any>;
    errors: string[];
    warnings: string[];
}

export interface McpExecutionResult {
    success: boolean;
    executedInstructions: number;
    skippedInstructions: number;
    errors: string[];
    warnings: string[];
    results: Record<string, any>;
    executionTime: number;
}

export interface McpValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

// Предустановленные шаблоны .mcp файлов
export interface McpTemplate {
    id: string;
    name: string;
    description: string;
    category: 'project' | 'task' | 'plan' | 'maintenance' | 'custom';
    content: McpFile;
}

// Настройки выполнения .mcp файлов
export interface McpExecutionOptions {
    dryRun?: boolean;
    stopOnError?: boolean;
    timeout?: number;
    confirmBeforeExecution?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
} 