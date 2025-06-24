import { IApiService } from '../interfaces/IApiService';
import { Task } from '../types';
import { 
  ITaskSearchEngine, 
  TaskSearchQuery, 
  TaskSearchResult, 
  SearchOptions 
} from '../types/search';
import { Logger } from '../utils/Logger';

interface CacheEntry {
  data: TaskSearchResult[];
  timestamp: number;
  ttl: number;
}

export class TaskSearchEngine implements ITaskSearchEngine {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 минут
  private readonly FUZZY_THRESHOLD = 0.6;
  private logger: Logger;

  constructor(private apiService: IApiService) {
    this.logger = new Logger();
  }

  async findById(id: number): Promise<TaskSearchResult | null> {
    try {
      const task = await this.apiService.getTask(id.toString());
      if (!task) {
        return null;
      }
      return this.convertTaskToSearchResult(task);
    } catch (error) {
      this.logger.error(`TaskSearchEngine.findById: Error finding task ${id}`, error);
      return null;
    }
  }

  async findByTitle(title: string, options: SearchOptions = {}): Promise<TaskSearchResult[]> {
    const cacheKey = `title:${title}:${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const allTasks = await this.getAllTasks();
      const results = this.searchByTitle(allTasks, title, options);
      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      this.logger.error('TaskSearchEngine.findByTitle: Error searching by title', error);
      return [];
    }
  }

  async findByKeywords(keywords: string[], options: SearchOptions = {}): Promise<TaskSearchResult[]> {
    const cacheKey = `keywords:${keywords.join(',')}:${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const allTasks = await this.getAllTasks();
      const results = this.searchByKeywords(allTasks, keywords, options);
      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      this.logger.error('TaskSearchEngine.findByKeywords: Error searching by keywords', error);
      return [];
    }
  }

  async smartSearch(query: TaskSearchQuery, options: SearchOptions = {}): Promise<TaskSearchResult[]> {
    const cacheKey = `smart:${JSON.stringify(query)}:${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let allTasks = await this.getAllTasks();

      // Фильтрация по проекту
      if (query.projectId) {
        allTasks = allTasks.filter(task => parseInt(task.project_id) === query.projectId);
      }

      // Фильтрация по статусу
      if (query.status) {
        allTasks = allTasks.filter(task => 
          task.status.toLowerCase() === query.status!.toLowerCase()
        );
      }

      // Фильтрация по приоритету
      if (query.priority) {
        allTasks = allTasks.filter(task => 
          task.priority.toLowerCase() === query.priority!.toLowerCase()
        );
      }

      // Фильтрация по исполнителю
      if (query.assignedTo) {
        allTasks = allTasks.filter(task => 
          task.assignee?.toLowerCase().includes(query.assignedTo!.toLowerCase())
        );
      }

      // Поиск по тексту запроса
      let results: TaskSearchResult[] = [];
      if (query.query.trim()) {
        results = this.performTextSearch(allTasks, query.query, options);
      } else {
        results = allTasks.map(task => this.convertTaskToSearchResult(task));
      }

      // Применение лимита
      if (query.limit && query.limit > 0) {
        results = results.slice(0, query.limit);
      }

      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      this.logger.error('TaskSearchEngine.smartSearch: Error in smart search', error);
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.logger.info('TaskSearchEngine: Cache cleared');
  }

  private async getAllTasks(): Promise<Task[]> {
    try {
      return await this.apiService.getTasks();
    } catch (error) {
      this.logger.error('TaskSearchEngine.getAllTasks: Error fetching tasks', error);
      return [];
    }
  }

  private searchByTitle(tasks: Task[], title: string, options: SearchOptions): TaskSearchResult[] {
    const threshold = options.fuzzyThreshold || this.FUZZY_THRESHOLD;
    const maxResults = options.maxResults || 50;

    const results = tasks
      .map(task => {
        const relevanceScore = this.calculateTitleRelevance(task.title, title);
        return {
          task,
          relevanceScore
        };
      })
      .filter(item => item.relevanceScore >= threshold)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults)
      .map(item => {
        const result = this.convertTaskToSearchResult(item.task);
        result.relevanceScore = item.relevanceScore;
        return result;
      });

    return this.applySorting(results, options.sortBy);
  }

  private searchByKeywords(tasks: Task[], keywords: string[], options: SearchOptions): TaskSearchResult[] {
    const threshold = options.fuzzyThreshold || this.FUZZY_THRESHOLD;
    const maxResults = options.maxResults || 50;

    const results = tasks
      .map(task => {
        const relevanceScore = this.calculateKeywordRelevance(task, keywords);
        return {
          task,
          relevanceScore
        };
      })
      .filter(item => item.relevanceScore >= threshold)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults)
      .map(item => {
        const result = this.convertTaskToSearchResult(item.task);
        result.relevanceScore = item.relevanceScore;
        return result;
      });

    return this.applySorting(results, options.sortBy);
  }

  private performTextSearch(tasks: Task[], query: string, options: SearchOptions): TaskSearchResult[] {
    const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    if (keywords.length === 0) {
      return tasks.map(task => this.convertTaskToSearchResult(task));
    }

    return this.searchByKeywords(tasks, keywords, options);
  }

  private calculateTitleRelevance(title: string, searchTitle: string): number {
    const titleLower = title.toLowerCase();
    const searchLower = searchTitle.toLowerCase();

    // Точное совпадение
    if (titleLower === searchLower) {
      return 1.0;
    }

    // Содержит полную фразу
    if (titleLower.includes(searchLower)) {
      return 0.9;
    }

    // Fuzzy matching
    return this.calculateLevenshteinSimilarity(titleLower, searchLower);
  }

  private calculateKeywordRelevance(task: Task, keywords: string[]): number {
    const searchText = `${task.title} ${task.description}`.toLowerCase();
    let totalScore = 0;
    let matchedKeywords = 0;

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Точное совпадение слова
      if (searchText.includes(keywordLower)) {
        totalScore += 1.0;
        matchedKeywords++;
      } else {
        // Fuzzy matching для каждого слова в тексте
        const words = searchText.split(/\s+/);
        let bestMatch = 0;
        
        for (const word of words) {
          const similarity = this.calculateLevenshteinSimilarity(word, keywordLower);
          if (similarity > bestMatch) {
            bestMatch = similarity;
          }
        }
        
        if (bestMatch >= this.FUZZY_THRESHOLD) {
          totalScore += bestMatch;
          matchedKeywords++;
        }
      }
    }

    return matchedKeywords > 0 ? totalScore / keywords.length : 0;
  }

  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private applySorting(results: TaskSearchResult[], sortBy?: string): TaskSearchResult[] {
    switch (sortBy) {
      case 'date':
        return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      case 'priority':
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return results.sort((a, b) => {
          const aPriority = priorityOrder[a.priority.toLowerCase() as keyof typeof priorityOrder] || 0;
          const bPriority = priorityOrder[b.priority.toLowerCase() as keyof typeof priorityOrder] || 0;
          return bPriority - aPriority;
        });
      case 'relevance':
      default:
        return results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }
  }

  private convertTaskToSearchResult(task: Task): TaskSearchResult {
    return {
      id: parseInt(task.id),
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      projectId: parseInt(task.project_id),
      projectName: undefined, // Task type doesn't have projectName
      assignedTo: task.assignee,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    };
  }

  private getFromCache(key: string): TaskSearchResult[] | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: TaskSearchResult[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    });
  }
} 