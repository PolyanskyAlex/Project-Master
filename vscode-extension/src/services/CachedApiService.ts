import { ApiService } from './ApiService';
import { CacheService } from './CacheService';
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
    CreateTaskRequest,
    UpdateTaskRequest,
    CreateProjectRequest
} from '../types';

/**
 * Кэширующий декоратор для ApiService
 */
export class CachedApiService implements IApiService {
    private apiService: ApiService;
    private cacheService: CacheService;
    private logger: Logger;

    constructor(
        configService: ConfigurationService,
        logger: Logger,
        cacheService?: CacheService
    ) {
        this.apiService = new ApiService(configService, logger);
        this.cacheService = cacheService || new CacheService();
        this.logger = logger;
    }

    /**
     * Обновление конфигурации
     */
    updateConfiguration(): void {
        this.apiService.updateConfiguration();
        // Очистка кэша при изменении конфигурации
        this.cacheService.clear();
        this.logger.info('Configuration updated, cache cleared');
    }

    // Projects

    async getProjects(): Promise<Project[]> {
        const cached = this.cacheService.getCachedProjects();
        if (cached) {
            this.logger.debug('Returning cached projects');
            return cached;
        }

        try {
            const projects = await this.apiService.getProjects();
            this.cacheService.cacheProjects(projects);
            return projects;
        } catch (error) {
            this.logger.error('Failed to fetch projects', error);
            throw error;
        }
    }

    async getProject(id: string): Promise<Project> {
        const cached = this.cacheService.getCachedProject(id);
        if (cached) {
            this.logger.debug(`Returning cached project: ${id}`);
            return cached;
        }

        try {
            const project = await this.apiService.getProject(id);
            this.cacheService.set(`project:${id}`, project);
            return project;
        } catch (error) {
            this.logger.error(`Failed to fetch project ${id}`, error);
            throw error;
        }
    }

    async createProject(project: CreateProjectRequest): Promise<Project> {
        try {
            const newProject = await this.apiService.createProject(project);
            
            // Инвалидация кэша проектов
            this.cacheService.delete('projects:all');
            this.cacheService.delete('functional-blocks:all');
            
            // Кэширование нового проекта
            this.cacheService.set(`project:${newProject.id}`, newProject);
            
            return newProject;
        } catch (error) {
            this.logger.error('Failed to create project', error);
            throw error;
        }
    }

    async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
        try {
            const updatedProject = await this.apiService.updateProject(projectId, updates);
            
            // Обновление кэша
            this.cacheService.set(`project:${projectId}`, updatedProject);
            this.cacheService.delete('projects:all');
            
            return updatedProject;
        } catch (error) {
            this.logger.error(`Failed to update project ${projectId}`, error);
            throw error;
        }
    }

    async deleteProject(projectId: string): Promise<void> {
        try {
            await this.apiService.deleteProject(projectId);
            
            // Инвалидация всего кэша проекта
            this.cacheService.invalidateProject(projectId);
            
        } catch (error) {
            this.logger.error(`Failed to delete project ${projectId}`, error);
            throw error;
        }
    }

    // Tasks

    async getTasks(projectId?: string): Promise<Task[]> {
        const cached = this.cacheService.getCachedTasks(projectId);
        if (cached) {
            this.logger.debug(`Returning cached tasks for project: ${projectId || 'all'}`);
            return cached;
        }

        try {
            const tasks = await this.apiService.getTasks(projectId);
            
            // Проверка и валидация полученных данных
            if (Array.isArray(tasks)) {
            this.cacheService.cacheTasks(tasks, projectId);
            return tasks;
            } else {
                this.logger.warn('API returned non-array tasks data:', tasks);
                return []; // Возвращаем пустой массив вместо undefined
            }
        } catch (error) {
            this.logger.error('Failed to fetch tasks', error);
            // Возвращаем пустой массив вместо выброса ошибки для лучшего UX
            return [];
        }
    }

    async getTask(id: string): Promise<Task> {
        const cached = this.cacheService.getCachedTask(id);
        if (cached) {
            this.logger.debug(`Returning cached task: ${id}`);
            return cached;
        }

        try {
            const task = await this.apiService.getTask(id);
            this.cacheService.set(`task:${id}`, task);
            return task;
        } catch (error) {
            this.logger.error(`Failed to fetch task ${id}`, error);
            throw error;
        }
    }

    async createTask(task: CreateTaskRequest): Promise<Task> {
        try {
            const newTask = await this.apiService.createTask(task);
            
            // Инвалидация кэша задач
            this.cacheService.invalidatePattern('tasks:.*');
            this.cacheService.invalidatePattern('plan:.*');
            
            // Кэширование новой задачи
            this.cacheService.set(`task:${newTask.id}`, newTask);
            
            return newTask;
        } catch (error) {
            this.logger.error('Failed to create task', error);
            throw error;
        }
    }

    async updateTask(id: string, task: UpdateTaskRequest): Promise<Task> {
        try {
            const updatedTask = await this.apiService.updateTask(id, task);
            
            // Обновление кэша
            this.cacheService.set(`task:${id}`, updatedTask);
            this.cacheService.invalidatePattern('tasks:.*');
            this.cacheService.invalidatePattern('plan:.*');
            
            return updatedTask;
        } catch (error) {
            this.logger.error(`Failed to update task ${id}`, error);
            throw error;
        }
    }

    async deleteTask(id: string): Promise<void> {
        try {
            await this.apiService.deleteTask(id);
            
            // Инвалидация кэша задачи
            this.cacheService.invalidateTask(id);
            
        } catch (error) {
            this.logger.error(`Failed to delete task ${id}`, error);
            throw error;
        }
    }

    // Functional Blocks

    async getFunctionalBlocks(): Promise<FunctionalBlock[]> {
        const cached = this.cacheService.getCachedFunctionalBlocks();
        if (cached) {
            this.logger.debug('Returning cached functional blocks');
            return cached;
        }

        try {
            const blocks = await this.apiService.getFunctionalBlocks();
            this.cacheService.cacheFunctionalBlocks(blocks, 10 * 60 * 1000); // 10 минут
            return blocks;
        } catch (error) {
            this.logger.error('Failed to fetch functional blocks', error);
            throw error;
        }
    }

    // Documents

    async getDocuments(projectId?: string): Promise<Document[]> {
        const cached = this.cacheService.getCachedDocuments(projectId);
        if (cached) {
            this.logger.debug(`Returning cached documents for project: ${projectId || 'all'}`);
            return cached;
        }

        try {
            const documents = await this.apiService.getDocuments(projectId);
            this.cacheService.cacheDocuments(documents, projectId);
            return documents;
        } catch (error) {
            this.logger.error('Failed to fetch documents', error);
            throw error;
        }
    }

    // Development Plan

    async getPlan(projectId: string): Promise<PlanItem[]> {
        const cached = this.cacheService.getCachedPlan(projectId);
        if (cached) {
            this.logger.debug(`Returning cached plan for project: ${projectId}`);
            return cached;
        }

        try {
            const plan = await this.apiService.getPlan(projectId);
            this.cacheService.cachePlan(plan, projectId);
            return plan;
        } catch (error) {
            this.logger.error(`Failed to fetch plan for project ${projectId}`, error);
            throw error;
        }
    }

    async addTaskToPlan(projectId: string, taskId: string): Promise<PlanItem> {
        try {
            const planItem = await this.apiService.addTaskToPlan(projectId, taskId);
            
            // Инвалидация кэша плана
            this.cacheService.delete(`plan:project:${projectId}`);
            
            return planItem;
        } catch (error) {
            this.logger.error(`Failed to add task ${taskId} to plan for project ${projectId}`, error);
            throw error;
        }
    }

    async removeTaskFromPlan(projectId: string, taskId: string): Promise<void> {
        try {
            await this.apiService.removeTaskFromPlan(projectId, taskId);
            
            // Инвалидация кэша плана
            this.cacheService.delete(`plan:project:${projectId}`);
            
        } catch (error) {
            this.logger.error(`Failed to remove task ${taskId} from plan for project ${projectId}`, error);
            throw error;
        }
    }

    async reorderPlan(projectId: string, taskIds: string[]): Promise<void> {
        try {
            await this.apiService.reorderPlan(projectId, taskIds);
            
            // Инвалидация кэша плана
            this.cacheService.delete(`plan:project:${projectId}`);
            
        } catch (error) {
            this.logger.error(`Failed to reorder plan for project ${projectId}`, error);
            throw error;
        }
    }

    // Comments

    async getTaskComments(taskId: string): Promise<Comment[]> {
        const cached = this.cacheService.getCachedComments(taskId);
        if (cached) {
            this.logger.debug(`Returning cached comments for task: ${taskId}`);
            return cached;
        }

        try {
            const comments = await this.apiService.getTaskComments(taskId);
            this.cacheService.cacheComments(comments, taskId, 2 * 60 * 1000); // 2 минуты
            return comments;
        } catch (error) {
            this.logger.error(`Failed to fetch comments for task ${taskId}`, error);
            throw error;
        }
    }

    async addTaskComment(taskId: string, content: string, author: string): Promise<Comment> {
        try {
            const comment = await this.apiService.addTaskComment(taskId, content, author);
            
            // Инвалидация кэша комментариев
            this.cacheService.delete(`comments:task:${taskId}`);
            
            return comment;
        } catch (error) {
            this.logger.error(`Failed to add comment to task ${taskId}`, error);
            throw error;
        }
    }

    async createComment(comment: Omit<Comment, 'id' | 'created_at' | 'updated_at'>): Promise<Comment> {
        try {
            const newComment = await this.apiService.createComment(comment);
            
            // Инвалидация кэша комментариев
            this.cacheService.delete(`comments:task:${comment.task_id}`);
            
            return newComment;
        } catch (error) {
            this.logger.error('Failed to create comment', error);
            throw error;
        }
    }

    async updateComment(commentId: string, updates: Partial<Comment>): Promise<Comment> {
        try {
            const updatedComment = await this.apiService.updateComment(commentId, updates);
            
            // Инвалидация кэша комментариев
            this.cacheService.delete(`comments:task:${updatedComment.task_id}`);
            
            return updatedComment;
        } catch (error) {
            this.logger.error(`Failed to update comment ${commentId}`, error);
            throw error;
        }
    }

    async deleteComment(commentId: string): Promise<void> {
        try {
            // Получаем комментарий для определения task_id перед удалением
            const comment = await this.apiService.getTaskComments(''); // Нужно будет получить task_id
            
            await this.apiService.deleteComment(commentId);
            
            // Инвалидация кэша комментариев (нужно знать task_id)
            this.cacheService.invalidatePattern('comments:.*');
            
        } catch (error) {
            this.logger.error(`Failed to delete comment ${commentId}`, error);
            throw error;
        }
    }

    // Health Check

    async healthCheck(): Promise<boolean> {
        try {
            return await this.apiService.healthCheck();
        } catch (error) {
            this.logger.error('Health check failed', error);
            throw error;
        }
    }

    // Cache Management

    /**
     * Получение статистики кэша
     */
    getCacheStats() {
        return this.cacheService.getStats();
    }

    /**
     * Очистка кэша
     */
    clearCache(): void {
        this.cacheService.clear();
        this.logger.info('Cache cleared manually');
    }

    /**
     * Инвалидация кэша по паттерну
     */
    invalidatePattern(pattern: string): number {
        return this.cacheService.invalidatePattern(pattern);
    }

    /**
     * Предварительная загрузка данных в кэш
     */
    async preloadCache(): Promise<void> {
        await this.cacheService.preload(this.apiService);
    }

    /**
     * Экспорт кэша для отладки
     */
    exportCache(): Record<string, any> {
        return this.cacheService.exportCache();
    }

    /**
     * Освобождение ресурсов
     */
    dispose(): void {
        this.cacheService.dispose();
        this.logger.info('CachedApiService disposed');
    }
} 