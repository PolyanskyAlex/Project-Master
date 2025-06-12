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
 * Интерфейс для API сервиса
 */
export interface IApiService {
    // Configuration
    updateConfiguration(): void;

    // Projects
    getProjects(): Promise<Project[]>;
    getProject(id: string): Promise<Project>;
    createProject(project: CreateProjectRequest): Promise<Project>;
    updateProject(projectId: string, updates: Partial<Project>): Promise<Project>;
    deleteProject(projectId: string): Promise<void>;

    // Tasks
    getTasks(projectId?: string): Promise<Task[]>;
    getTask(id: string): Promise<Task>;
    createTask(task: CreateTaskRequest): Promise<Task>;
    updateTask(id: string, task: UpdateTaskRequest): Promise<Task>;
    deleteTask(id: string): Promise<void>;

    // Functional Blocks
    getFunctionalBlocks(): Promise<FunctionalBlock[]>;

    // Documents
    getDocuments(projectId?: string): Promise<Document[]>;

    // Development Plan
    getPlan(projectId: string): Promise<PlanItem[]>;
    addTaskToPlan(projectId: string, taskId: string): Promise<PlanItem>;
    removeTaskFromPlan(projectId: string, taskId: string): Promise<void>;
    reorderPlan(projectId: string, taskIds: string[]): Promise<void>;

    // Comments
    getTaskComments(taskId: string): Promise<Comment[]>;
    addTaskComment(taskId: string, content: string, author: string): Promise<Comment>;
    createComment(comment: Omit<Comment, 'id' | 'created_at' | 'updated_at'>): Promise<Comment>;
    updateComment(commentId: string, updates: Partial<Comment>): Promise<Comment>;
    deleteComment(commentId: string): Promise<void>;

    // Health Check
    healthCheck(): Promise<boolean>;
} 