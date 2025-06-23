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
            const response: AxiosResponse<Project[]> = await this.client.get('/api/v1/projects');
            return response.data;
        } catch (error) {
            this.logger.error('Failed to fetch projects', error);
            throw error;
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
            const response: AxiosResponse<Task[]> = await this.client.get(url);
            return response.data;
        } catch (error) {
            this.logger.error('Failed to fetch tasks', error);
            throw error;
        }
    }

    async getTask(id: string): Promise<Task> {
        try {
            const response: AxiosResponse<ApiResponse<Task>> = await this.client.get(`/api/v1/tasks/${id}`);
            return response.data.data;
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
            const response: AxiosResponse<FunctionalBlock[]> = await this.client.get('/api/v1/functional-blocks');
            return response.data;
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