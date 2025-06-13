// Базовые типы для API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Функциональные блоки
export interface FunctionalBlock {
  id: string;
  name: string;
  prefix: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFunctionalBlockRequest {
  name: string;
  prefix: string;
  description?: string;
}

export interface UpdateFunctionalBlockRequest {
  name?: string;
  prefix?: string;
  description?: string;
}

// Проекты
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'Планирование' | 'В разработке' | 'Тестирование' | 'Завершен' | 'Приостановлен';

export interface CreateProjectRequest {
  name: string;
  description?: string;
  status: ProjectStatus;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

// Задачи
export interface Task {
  id: string;
  number: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  projectId: string;
  parentTaskId?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'Новая' | 'В работе' | 'Тестирование' | 'Выполнена' | 'Отменена';
export type TaskPriority = 'Низкий' | 'Средний' | 'Высокий' | 'Критический';
export type TaskType = 'Новый функционал' | 'Исправление ошибки' | 'Улучшение' | 'Рефакторинг' | 'Документация';

export interface CreateTaskRequest {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  projectId: string;
  parentTaskId?: string;
  assignedTo?: string;
  estimatedHours?: number;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  projectId?: string;
  parentTaskId?: string;
  assignedTo?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
}

// Комментарии
export interface Comment {
  id: string;
  taskId: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface CreateCommentRequest {
  taskId: string;
  content: string;
  author: string;
}

// Документы
export interface Document {
  id: string;
  projectId: string;
  title: string;
  content: string;
  type: DocumentType;
  agentEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = 'BRD' | 'SAD' | 'AI-Ready' | 'AI Executable' | 'Technical' | 'User Guide' | 'API Documentation';

export interface CreateDocumentRequest {
  projectId: string;
  title: string;
  content: string;
  type: DocumentType;
  agentEditable: boolean;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  type?: DocumentType;
  agentEditable?: boolean;
}

// План разработки
export interface ProjectPlanItem {
  id: string;
  projectId: string;
  taskId: string;
  sequenceOrder: number;
  createdAt: string;
  updatedAt: string;
  taskNumber: string;
  taskTitle: string;
  taskDescription: string;
  taskStatus: string;
  taskPriority: string;
  taskType: string;
}

export interface ProjectPlan {
  projectId: string;
  items: ProjectPlanItem[];
}

export interface TaskSequence {
  taskId: string;
  sequenceOrder: number;
}

export interface ReorderRequest {
  taskSequences: TaskSequence[];
}

export interface MoveTaskRequest {
  position: number;
}

export interface BatchTaskRequest {
  task_ids: string[];
}

export interface ProjectPlanStats {
  project_id: string;
  total_tasks: number;
  task_count: number;
  status_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
  type_distribution: Record<string, number>;
}

// Логи операций
export interface OperationLog {
  id: string;
  taskId: string;
  operationType: OperationType;
  operationDetails: string;
  performedBy: string;
  createdAt: string;
}

export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'COMMENT' | 'STATUS_CHANGE';

// Общие типы для списков
export interface ListResponse<T> {
  items: T[];
  total: number;
}

// Параметры запросов
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FilterParams {
  status?: string;
  priority?: string;
  type?: string;
  projectId?: string;
}

// Ошибки API
export interface ApiError {
  error: string;
  message?: string;
  details?: any;
} 