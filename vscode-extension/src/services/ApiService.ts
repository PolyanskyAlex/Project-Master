import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ConfigurationService } from './ConfigurationService';
import { Logger } from '../utils/Logger';
import { IApiService } from '../interfaces/IApiService';
import {
    Project,
    Task,
    FunctionalBlock,
    Document,
    PlanItem,
    Comment,
    ApiResponse,
    PaginatedResponse,
    CreateTaskRequest,
    UpdateTaskRequest,
    CreateProjectRequest
} from '../types';

/**
 * API Service for Project Master backend
 */
export class ApiService implements IApiService {
    private client: AxiosInstance;
    private configService: ConfigurationService;
    private logger: Logger;

    constructor(configService: ConfigurationService, logger: Logger) {
        this.configService = configService;
        this.logger = logger;
        this.client = this.createClient();
    }

    private createClient(): AxiosInstance {
        const config = this.configService.getConfig();
        
        const client = axios.create({
            baseURL: config.apiUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                ...(config.apiKey && { 'X-API-Key': config.apiKey })
            }
        });

        this.client = client;
        this.setupInterceptors();

        return client;
    }

    updateConfiguration(): void {
        this.configService.updateConfiguration();
        this.client = this.createClient();
        this.logger.info('API client configuration updated');
    }

    async updateConfigurationWithDiscovery(): Promise<void> {
        this.configService.updateConfiguration();
        
        // Попытка обнаружить сервер
        const apiUrl = await this.configService.getApiUrlWithDiscovery();
        const config = this.configService.getConfig();
        
        this.client = axios.create({
            baseURL: apiUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                ...(config.apiKey && { 'X-API-Key': config.apiKey })
            }
        });

        // Настройка интерцепторов
        this.setupInterceptors();
        
        this.logger.info(`API client updated with discovered server: ${apiUrl}`);
    }

    private setupInterceptors(): void {
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                this.logger.debug(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
                    baseURL: config.baseURL,
                    headers: config.headers,
                    data: config.data
                });
                return config;
            },
            (error) => {
                this.logger.error('❌ API Request Error', {
                    message: error.message,
                    code: error.code,
                    config: error.config
                });
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => {
                this.logger.debug(`✅ API Response: ${response.status} ${response.config.url}`, {
                    status: response.status,
                    statusText: response.statusText,
                    data: response.data,
                    responseTime: response.headers['x-response-time']
                });
                return response;
            },
            (error) => {
                const errorInfo = {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    url: error.config?.url,
                    method: error.config?.method?.toUpperCase(),
                    message: error.message,
                    code: error.code,
                    baseURL: error.config?.baseURL
                };

                if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                    this.logger.error('🔌 API Connection Error - Server not reachable', errorInfo);
                } else if (error.response?.status >= 500) {
                    this.logger.error('🚨 API Server Error', errorInfo);
                } else if (error.response?.status >= 400) {
                    this.logger.warn('⚠️ API Client Error', errorInfo);
                } else {
                    this.logger.error('❌ API Unknown Error', errorInfo);
                }
                
                return Promise.reject(error);
            }
        );
    }

    // Projects
    async getProjects(): Promise<Project[]> {
        try {
            const response: AxiosResponse<any[]> = await this.client.get('/api/v1/projects');
            // Map API response (camelCase) to extension types (snake_case)
            return response.data.map((project: any) => ({
                id: project.id,
                name: project.name,
                description: project.description,
                status: this.mapProjectStatus(project.status),
                created_at: project.createdAt || project.created_at,
                updated_at: project.updatedAt || project.updated_at,
                functional_block_id: project.functional_block_id
            }));
        } catch (error) {
            this.logger.error('Failed to fetch projects', error);
            throw error;
        }
    }

    private mapProjectStatus(status: string): 'active' | 'completed' | 'on_hold' | 'cancelled' {
        // Map API status values to expected enum values
        switch (status?.toLowerCase()) {
            case 'планирование':
            case 'planning':
                return 'active';
            case 'в работе':
            case 'in_progress':
            case 'активный':
            case 'active':
                return 'active';
            case 'завершён':
            case 'завершен':
            case 'completed':
            case 'done':
                return 'completed';
            case 'приостановлен':
            case 'на паузе':
            case 'on_hold':
            case 'paused':
                return 'on_hold';
            case 'отменён':
            case 'отменен':
            case 'cancelled':
            case 'canceled':
                return 'cancelled';
            default:
                this.logger.warn(`Unknown project status: ${status}, defaulting to 'active'`);
                return 'active';
        }
    }

    private mapTaskStatus(status: string): 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' {
        switch (status?.toLowerCase()) {
            case 'новая':
            case 'к выполнению':
            case 'todo':
                return 'todo';
            case 'в работе':
            case 'in_progress':
                return 'in_progress';
            case 'на проверке':
            case 'проверка':
            case 'review':
                return 'review';
            case 'завершена':
            case 'готово':
            case 'done':
                return 'done';
            case 'отменена':
            case 'отклонена':
            case 'cancelled':
                return 'cancelled';
            default:
                this.logger.warn(`Unknown task status: ${status}, defaulting to 'todo'`);
                return 'todo';
        }
    }

    private mapTaskPriority(priority: string): 'low' | 'medium' | 'high' | 'critical' {
        switch (priority?.toLowerCase()) {
            case 'низкий':
            case 'low':
                return 'low';
            case 'средний':
            case 'medium':
                return 'medium';
            case 'высокий':
            case 'high':
                return 'high';
            case 'критический':
            case 'critical':
                return 'critical';
            default:
                this.logger.warn(`Unknown task priority: ${priority}, defaulting to 'medium'`);
                return 'medium';
        }
    }

    private mapTaskType(type: string): 'feature' | 'bug' | 'improvement' | 'documentation' | 'test' {
        switch (type?.toLowerCase()) {
            case 'новый функционал':
            case 'функция':
            case 'feature':
                return 'feature';
            case 'ошибка':
            case 'баг':
            case 'bug':
                return 'bug';
            case 'улучшение':
            case 'рефакторинг':
            case 'improvement':
                return 'improvement';
            case 'документация':
            case 'documentation':
                return 'documentation';
            case 'тест':
            case 'тестирование':
            case 'test':
                return 'test';
            case 'задача':
            case 'task':
            default:
                this.logger.warn(`Unknown task type: ${type}, defaulting to 'feature'`);
                return 'feature';
        }
    }

    async getProject(id: string): Promise<Project> {
        try {
            const response: AxiosResponse<Project> = await this.client.get(`/api/v1/projects/${id}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch project ${id}`, error);
            throw error;
        }
    }

    async createProject(project: CreateProjectRequest): Promise<Project> {
        try {
            const response: AxiosResponse<ApiResponse<Project>> = await this.client.post('/api/v1/projects', project);
            return response.data.data;
        } catch (error) {
            this.logger.error('Failed to create project', error);
            throw error;
        }
    }

    // Tasks
    async getTasks(projectId?: string): Promise<Task[]> {
        try {
            const url = projectId ? `/api/v1/tasks?project_id=${projectId}` : '/api/v1/tasks';
            const response: AxiosResponse<any[]> = await this.client.get(url);
            
            // Map API response (camelCase) to extension types (snake_case)
            return response.data.map((task: any) => ({
                id: task.id,
                title: task.title,
                description: task.description,
                status: this.mapTaskStatus(task.status),
                priority: this.mapTaskPriority(task.priority),
                type: this.mapTaskType(task.type),
                project_id: task.projectId,
                assignee: task.assignedTo || null, // Backend doesn't have this field
                due_date: task.dueDate || null, // Backend doesn't have this field
                created_at: task.createdAt,
                updated_at: task.updatedAt,
                estimated_hours: task.estimatedHours || null, // Backend doesn't have this field
                actual_hours: task.actualHours || null, // Backend doesn't have this field
                tags: task.tags || [] // Backend doesn't have this field
            }));
        } catch (error) {
            this.logger.error('Failed to fetch tasks', error);
            throw error;
        }
    }

    async getTask(id: string): Promise<Task> {
        try {
            const response: AxiosResponse<any> = await this.client.get(`/api/v1/tasks/${id}`);
            
            // Map API response (like in getTasks) from camelCase to snake_case
            const task = response.data;
            return {
                id: task.id,
                title: task.title,
                description: task.description,
                status: this.mapTaskStatus(task.status),
                priority: this.mapTaskPriority(task.priority),
                type: this.mapTaskType(task.type),
                project_id: task.projectId,
                assignee: task.assignedTo || null, // Backend doesn't have this field
                due_date: task.dueDate || null, // Backend doesn't have this field  
                created_at: task.createdAt,
                updated_at: task.updatedAt,
                estimated_hours: task.estimatedHours || null, // Backend doesn't have this field
                actual_hours: task.actualHours || null, // Backend doesn't have this field
                tags: task.tags || [] // Backend doesn't have this field
            };
        } catch (error) {
            this.logger.error(`Failed to fetch task ${id}`, error);
            throw error;
        }
    }

    async createTask(task: CreateTaskRequest): Promise<Task> {
        try {
            const response: AxiosResponse<ApiResponse<Task>> = await this.client.post('/api/v1/tasks', task);
            return response.data.data;
        } catch (error) {
            this.logger.error('Failed to create task', error);
            throw error;
        }
    }

    async updateTask(id: string, task: UpdateTaskRequest): Promise<Task> {
        try {
            const response: AxiosResponse<ApiResponse<Task>> = await this.client.put(`/api/v1/tasks/${id}`, task);
            return response.data.data;
        } catch (error) {
            this.logger.error(`Failed to update task ${id}`, error);
            throw error;
        }
    }

    async deleteTask(id: string): Promise<void> {
        try {
            await this.client.delete(`/api/v1/tasks/${id}`);
        } catch (error) {
            this.logger.error(`Failed to delete task ${id}`, error);
            throw error;
        }
    }

    // Functional Blocks
    async getFunctionalBlocks(): Promise<FunctionalBlock[]> {
        try {
            const response: AxiosResponse<any[]> = await this.client.get('/api/v1/functional-blocks');
            // Map API response (camelCase) to extension types (snake_case)
            return response.data.map((block: any) => ({
                id: block.id,
                name: block.name,
                description: block.description,
                created_at: block.createdAt || block.created_at,
                updated_at: block.updatedAt || block.updated_at
            }));
        } catch (error) {
            this.logger.error('Failed to fetch functional blocks', error);
            throw error;
        }
    }

    // Documents
    async getDocuments(projectId?: string): Promise<Document[]> {
        try {
            const url = projectId ? `/api/v1/documents?project_id=${projectId}` : '/api/v1/documents';
            const response: AxiosResponse<ApiResponse<Document[]>> = await this.client.get(url);
            return response.data.data;
        } catch (error) {
            this.logger.error('Failed to fetch documents', error);
            throw error;
        }
    }

    // Development Plan
    async getPlan(projectId: string): Promise<PlanItem[]> {
        try {
            const response: AxiosResponse<ApiResponse<PlanItem[]>> = await this.client.get(`/api/v1/projects/${projectId}/plan`);
            return response.data.data;
        } catch (error) {
            this.logger.error(`Failed to fetch plan for project ${projectId}`, error);
            throw error;
        }
    }

    async addTaskToPlan(projectId: string, taskId: string): Promise<PlanItem> {
        try {
            const response: AxiosResponse<ApiResponse<PlanItem>> = await this.client.post(`/api/v1/projects/${projectId}/plan/tasks/${taskId}`, {
                task_id: taskId
            });
            return response.data.data;
        } catch (error) {
            this.logger.error(`Failed to add task ${taskId} to plan`, error);
            throw error;
        }
    }

    async removeTaskFromPlan(projectId: string, taskId: string): Promise<void> {
        try {
            await this.client.delete(`/api/v1/projects/${projectId}/plan/tasks/${taskId}`);
        } catch (error) {
            this.logger.error(`Failed to remove task ${taskId} from plan`, error);
            throw error;
        }
    }

    async reorderPlan(projectId: string, taskIds: string[]): Promise<void> {
        try {
            await this.client.put(`/api/v1/projects/${projectId}/plan/reorder`, {
                task_ids: taskIds
            });
        } catch (error) {
            this.logger.error(`Failed to reorder plan for project ${projectId}`, error);
            throw error;
        }
    }

    // Comments
    async getTaskComments(taskId: string): Promise<Comment[]> {
        try {
            const response: AxiosResponse<ApiResponse<Comment[]>> = await this.client.get(`/api/v1/tasks/${taskId}/comments`);
            return response.data.data;
        } catch (error) {
            this.logger.error(`Failed to fetch comments for task ${taskId}`, error);
            throw error;
        }
    }

    async addTaskComment(taskId: string, content: string, author: string): Promise<Comment> {
        try {
            const response: AxiosResponse<ApiResponse<Comment>> = await this.client.post(`/api/v1/tasks/${taskId}/comments`, {
                content,
                author
            });
            return response.data.data;
        } catch (error) {
            this.logger.error(`Failed to add comment to task ${taskId}`, error);
            throw error;
        }
    }

    async createComment(comment: Omit<Comment, 'id' | 'created_at' | 'updated_at'>): Promise<Comment> {
        try {
            const response: AxiosResponse<ApiResponse<Comment>> = await this.client.post('/api/v1/comments', comment);
            return response.data.data;
        } catch (error) {
            this.logger.error('Failed to create comment', error);
            throw error;
        }
    }

    async updateComment(commentId: string, updates: Partial<Comment>): Promise<Comment> {
        try {
            const response: AxiosResponse<ApiResponse<Comment>> = await this.client.put(`/api/v1/comments/${commentId}`, updates);
            return response.data.data;
        } catch (error) {
            this.logger.error(`Failed to update comment ${commentId}`, error);
            throw error;
        }
    }

    async deleteComment(commentId: string): Promise<void> {
        try {
            await this.client.delete(`/api/v1/comments/${commentId}`);
        } catch (error) {
            this.logger.error(`Failed to delete comment ${commentId}`, error);
            throw error;
        }
    }

    async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
        try {
            const response: AxiosResponse<ApiResponse<Project>> = await this.client.put(`/api/v1/projects/${projectId}`, updates);
            return response.data.data;
        } catch (error) {
            this.logger.error(`Failed to update project ${projectId}`, error);
            throw error;
        }
    }

    async deleteProject(projectId: string): Promise<void> {
        try {
            await this.client.delete(`/api/v1/projects/${projectId}`);
        } catch (error) {
            this.logger.error(`Failed to delete project ${projectId}`, error);
            throw error;
        }
    }

    // Health check
    async healthCheck(): Promise<boolean> {
        try {
            await this.client.get('/health');
            return true;
        } catch (error) {
            this.logger.error('Health check failed', error);
            return false;
        }
    }
}