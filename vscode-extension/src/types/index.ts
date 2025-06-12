export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'completed' | 'on_hold' | 'cancelled';
    created_at: string;
    updated_at: string;
    functional_block_id?: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: 'feature' | 'bug' | 'improvement' | 'documentation' | 'test';
    project_id: string;
    assignee?: string;
    due_date?: string;
    created_at: string;
    updated_at: string;
    estimated_hours?: number;
    actual_hours?: number;
    tags?: string[];
}

export interface FunctionalBlock {
    id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface Document {
    id: string;
    title: string;
    content: string;
    type: 'requirement' | 'specification' | 'design' | 'manual' | 'other';
    project_id: string;
    created_at: string;
    updated_at: string;
    version: string;
    author?: string;
}

export interface PlanItem {
    id: string;
    task_id: string;
    project_id: string;
    order_index: number;
    created_at: string;
    updated_at: string;
    task?: Task;
}

export interface Comment {
    id: string;
    content: string;
    task_id: string;
    author: string;
    type: 'general' | 'status_update' | 'question' | 'issue' | 'suggestion' | 'reply';
    priority?: 'low' | 'medium' | 'high';
    parent_id?: string;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateTaskRequest {
    title: string;
    description: string;
    project_id: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    type?: 'feature' | 'bug' | 'improvement' | 'documentation' | 'test';
    assignee?: string;
    due_date?: string;
    estimated_hours?: number;
    tags?: string[];
}

export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    type?: 'feature' | 'bug' | 'improvement' | 'documentation' | 'test';
    assignee?: string;
    due_date?: string;
    estimated_hours?: number;
    actual_hours?: number;
    tags?: string[];
}

export interface CreateProjectRequest {
    name: string;
    description: string;
    functional_block_id?: string;
}

export interface ExtensionServices {
    apiService: any;
    logger: any;
    configService: any;
    projectsProvider: any;
    tasksProvider: any;
    planProvider: any;
}

export interface LogLevel {
    DEBUG: 'debug';
    INFO: 'info';
    WARN: 'warn';
    ERROR: 'error';
}

export interface ExtensionConfig {
    apiUrl: string;
    apiKey: string;
    webUrl: string;
    autoRefresh: boolean;
    refreshInterval: number;
    defaultProject: string;
    enableNotifications: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
} 