export interface TaskSearchQuery {
  query: string;
  projectId?: number;
  status?: string;
  priority?: string;
  assignedTo?: string;
  limit?: number;
}

export interface TaskSearchResult {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  projectId: number;
  projectName?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  relevanceScore?: number;
}

export interface SearchOptions {
  fuzzyThreshold?: number;
  maxResults?: number;
  includeArchived?: boolean;
  sortBy?: 'relevance' | 'date' | 'priority';
}

export interface ITaskSearchEngine {
  findById(id: number): Promise<TaskSearchResult | null>;
  findByTitle(title: string, options?: SearchOptions): Promise<TaskSearchResult[]>;
  findByKeywords(keywords: string[], options?: SearchOptions): Promise<TaskSearchResult[]>;
  smartSearch(query: TaskSearchQuery, options?: SearchOptions): Promise<TaskSearchResult[]>;
  clearCache(): void;
} 