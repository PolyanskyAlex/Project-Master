import * as vscode from 'vscode';
import { Logger } from '../utils/Logger';
import { Project, Task, FunctionalBlock, Document, PlanItem, Comment } from '../types';

/**
 * Интерфейс для элемента кэша
 */
interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live в миллисекундах
    key: string;
}

/**
 * Интерфейс для статистики кэша
 */
interface CacheStats {
    hits: number;
    misses: number;
    totalRequests: number;
    hitRate: number;
    size: number;
    memoryUsage: number;
}

/**
 * Сервис кэширования данных для расширения
 */
export class CacheService {
    private cache: Map<string, CacheItem<any>>;
    private logger: Logger;
    private stats: CacheStats;
    private maxSize: number;
    private defaultTtl: number;
    private cleanupInterval: NodeJS.Timeout | null;

    constructor(
        maxSize: number = 1000,
        defaultTtl: number = 5 * 60 * 1000 // 5 минут по умолчанию
    ) {
        this.cache = new Map();
        this.logger = new Logger();
        this.maxSize = maxSize;
        this.defaultTtl = defaultTtl;
        this.cleanupInterval = null;
        
        this.stats = {
            hits: 0,
            misses: 0,
            totalRequests: 0,
            hitRate: 0,
            size: 0,
            memoryUsage: 0
        };

        this.startCleanupTimer();
        this.logger.info('CacheService initialized', { maxSize, defaultTtl });
    }

    /**
     * Получение данных из кэша
     */
    public get<T>(key: string): T | null {
        this.stats.totalRequests++;
        
        const item = this.cache.get(key);
        
        if (!item) {
            this.stats.misses++;
            this.updateHitRate();
            this.logger.debug(`Cache miss for key: ${key}`);
            return null;
        }

        // Проверка TTL
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            this.stats.misses++;
            this.updateHitRate();
            this.logger.debug(`Cache expired for key: ${key}`);
            return null;
        }

        this.stats.hits++;
        this.updateHitRate();
        this.logger.debug(`Cache hit for key: ${key}`);
        return item.data as T;
    }

    /**
     * Сохранение данных в кэш
     */
    public set<T>(key: string, data: T, ttl?: number): void {
        // Проверка размера кэша
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        const item: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTtl,
            key
        };

        this.cache.set(key, item);
        this.updateStats();
        this.logger.debug(`Cache set for key: ${key}`, { ttl: item.ttl });
    }

    /**
     * Удаление элемента из кэша
     */
    public delete(key: string): boolean {
        const result = this.cache.delete(key);
        if (result) {
            this.updateStats();
            this.logger.debug(`Cache deleted for key: ${key}`);
        }
        return result;
    }

    /**
     * Очистка всего кэша
     */
    public clear(): void {
        this.cache.clear();
        this.resetStats();
        this.logger.info('Cache cleared');
    }

    /**
     * Проверка существования ключа в кэше
     */
    public has(key: string): boolean {
        const item = this.cache.get(key);
        if (!item) return false;
        
        // Проверка TTL
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }

    /**
     * Получение статистики кэша
     */
    public getStats(): CacheStats {
        this.updateStats();
        return { ...this.stats };
    }

    /**
     * Кэширование проектов
     */
    public cacheProjects(projects: Project[], ttl?: number): void {
        this.set('projects:all', projects, ttl);
        
        // Кэширование отдельных проектов
        projects.forEach(project => {
            this.set(`project:${project.id}`, project, ttl);
        });
    }

    /**
     * Получение проектов из кэша
     */
    public getCachedProjects(): Project[] | null {
        return this.get<Project[]>('projects:all');
    }

    /**
     * Получение проекта по ID из кэша
     */
    public getCachedProject(id: string): Project | null {
        return this.get<Project>(`project:${id}`);
    }

    /**
     * Кэширование задач
     */
    public cacheTasks(tasks: Task[], projectId?: string, ttl?: number): void {
        const key = projectId ? `tasks:project:${projectId}` : 'tasks:all';
        this.set(key, tasks, ttl);
        
        // Кэширование отдельных задач
        tasks.forEach(task => {
            this.set(`task:${task.id}`, task, ttl);
        });
    }

    /**
     * Получение задач из кэша
     */
    public getCachedTasks(projectId?: string): Task[] | null {
        const key = projectId ? `tasks:project:${projectId}` : 'tasks:all';
        return this.get<Task[]>(key);
    }

    /**
     * Получение задачи по ID из кэша
     */
    public getCachedTask(id: string): Task | null {
        return this.get<Task>(`task:${id}`);
    }

    /**
     * Кэширование функциональных блоков
     */
    public cacheFunctionalBlocks(blocks: FunctionalBlock[], ttl?: number): void {
        this.set('functional-blocks:all', blocks, ttl);
        
        blocks.forEach(block => {
            this.set(`functional-block:${block.id}`, block, ttl);
        });
    }

    /**
     * Получение функциональных блоков из кэша
     */
    public getCachedFunctionalBlocks(): FunctionalBlock[] | null {
        return this.get<FunctionalBlock[]>('functional-blocks:all');
    }

    /**
     * Кэширование документов
     */
    public cacheDocuments(documents: Document[], projectId?: string, ttl?: number): void {
        const key = projectId ? `documents:project:${projectId}` : 'documents:all';
        this.set(key, documents, ttl);
        
        documents.forEach(doc => {
            this.set(`document:${doc.id}`, doc, ttl);
        });
    }

    /**
     * Получение документов из кэша
     */
    public getCachedDocuments(projectId?: string): Document[] | null {
        const key = projectId ? `documents:project:${projectId}` : 'documents:all';
        return this.get<Document[]>(key);
    }

    /**
     * Кэширование плана разработки
     */
    public cachePlan(plan: PlanItem[], projectId: string, ttl?: number): void {
        this.set(`plan:project:${projectId}`, plan, ttl);
    }

    /**
     * Получение плана разработки из кэша
     */
    public getCachedPlan(projectId: string): PlanItem[] | null {
        return this.get<PlanItem[]>(`plan:project:${projectId}`);
    }

    /**
     * Кэширование комментариев
     */
    public cacheComments(comments: Comment[], taskId: string, ttl?: number): void {
        this.set(`comments:task:${taskId}`, comments, ttl);
    }

    /**
     * Получение комментариев из кэша
     */
    public getCachedComments(taskId: string): Comment[] | null {
        return this.get<Comment[]>(`comments:task:${taskId}`);
    }

    /**
     * Инвалидация кэша по паттерну
     */
    public invalidatePattern(pattern: string): number {
        let deletedCount = 0;
        const regex = new RegExp(pattern);
        
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                deletedCount++;
            }
        }
        
        this.updateStats();
        this.logger.info(`Invalidated ${deletedCount} cache entries matching pattern: ${pattern}`);
        return deletedCount;
    }

    /**
     * Инвалидация кэша проекта
     */
    public invalidateProject(projectId: string): void {
        this.delete(`project:${projectId}`);
        this.delete(`tasks:project:${projectId}`);
        this.delete(`documents:project:${projectId}`);
        this.delete(`plan:project:${projectId}`);
        this.delete('projects:all');
        this.logger.info(`Invalidated cache for project: ${projectId}`);
    }

    /**
     * Инвалидация кэша задачи
     */
    public invalidateTask(taskId: string): void {
        this.delete(`task:${taskId}`);
        this.delete(`comments:task:${taskId}`);
        this.invalidatePattern('tasks:.*');
        this.invalidatePattern('plan:.*');
        this.logger.info(`Invalidated cache for task: ${taskId}`);
    }

    /**
     * Предварительная загрузка данных в кэш
     */
    public async preload(apiService: any): Promise<void> {
        try {
            this.logger.info('Starting cache preload...');
            
            // Загрузка функциональных блоков
            const functionalBlocks = await apiService.getFunctionalBlocks();
            this.cacheFunctionalBlocks(functionalBlocks, 10 * 60 * 1000); // 10 минут
            
            // Загрузка проектов
            const projects = await apiService.getProjects();
            this.cacheProjects(projects, 5 * 60 * 1000); // 5 минут
            
            // Загрузка задач для активных проектов
            const activeProjects = projects.filter((p: Project) => p.status === 'active');
            for (const project of activeProjects.slice(0, 3)) { // Только первые 3 активных проекта
                const tasks = await apiService.getTasks(project.id);
                this.cacheTasks(tasks, project.id, 3 * 60 * 1000); // 3 минуты
            }
            
            this.logger.info('Cache preload completed');
        } catch (error) {
            this.logger.error('Cache preload failed', error);
        }
    }

    /**
     * Экспорт кэша для отладки
     */
    public exportCache(): Record<string, any> {
        const exported: Record<string, any> = {};
        
        for (const [key, item] of this.cache.entries()) {
            exported[key] = {
                data: item.data,
                timestamp: new Date(item.timestamp).toISOString(),
                ttl: item.ttl,
                age: Date.now() - item.timestamp
            };
        }
        
        return exported;
    }

    /**
     * Освобождение ресурсов
     */
    public dispose(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        
        this.clear();
        this.logger.info('CacheService disposed');
    }

    // Приватные методы

    private startCleanupTimer(): void {
        // Очистка устаревших элементов каждые 2 минуты
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 2 * 60 * 1000);
    }

    private cleanup(): void {
        const now = Date.now();
        let deletedCount = 0;
        
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                this.cache.delete(key);
                deletedCount++;
            }
        }
        
        if (deletedCount > 0) {
            this.updateStats();
            this.logger.debug(`Cleaned up ${deletedCount} expired cache entries`);
        }
    }

    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTimestamp = Date.now();
        
        for (const [key, item] of this.cache.entries()) {
            if (item.timestamp < oldestTimestamp) {
                oldestTimestamp = item.timestamp;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.logger.debug(`Evicted oldest cache entry: ${oldestKey}`);
        }
    }

    private updateHitRate(): void {
        this.stats.hitRate = this.stats.totalRequests > 0 
            ? (this.stats.hits / this.stats.totalRequests) * 100 
            : 0;
    }

    private updateStats(): void {
        this.stats.size = this.cache.size;
        this.stats.memoryUsage = this.estimateMemoryUsage();
        this.updateHitRate();
    }

    private resetStats(): void {
        this.stats = {
            hits: 0,
            misses: 0,
            totalRequests: 0,
            hitRate: 0,
            size: 0,
            memoryUsage: 0
        };
    }

    private estimateMemoryUsage(): number {
        // Приблизительная оценка использования памяти в байтах
        let totalSize = 0;
        
        for (const [key, item] of this.cache.entries()) {
            totalSize += key.length * 2; // UTF-16
            
            // Безопасная обработка item.data для предотвращения TypeError
            try {
                if (item.data !== undefined && item.data !== null) {
                    totalSize += JSON.stringify(item.data).length * 2;
                } else {
                    totalSize += 16; // Размер для null/undefined (8 байт + запас)
                }
            } catch (error) {
                // Если JSON.stringify не может обработать данные, используем примерный размер
                totalSize += 32;
                this.logger.warn(`Failed to stringify cache item data for key: ${key}`, error);
            }
            
            totalSize += 32; // Метаданные (timestamp, ttl, etc.)
        }
        
        return totalSize;
    }
} 