# Technical Documentation: ApiService Backend Integration

**Version:** 0.4.5  
**Last Updated:** 2025-06-23  
**Component:** VSCode Extension / ApiService  
**Audience:** Developers, Technical Leads  

## Overview

This document describes the technical implementation of ApiService integration with Project Master backend API, specifically addressing the response format handling that was corrected in version 0.4.5.

## API Response Format Analysis

### Backend API Response Structure

The Project Master backend API returns data in the following formats:

#### Projects Endpoint
```http
GET /api/v1/projects
Headers: X-API-Key: dev-api-key-12345
```

**Response Format:**
```typescript
// Direct array response (NOT wrapped in ApiResponse<T>)
Project[] = [
  {
    "id": "a85cc341-f11a-492f-86eb-460f72640d95",
    "name": "test",
    "description": "1", 
    "status": "Планирование",
    "createdAt": "2025-06-21T17:45:41.01053Z",
    "updatedAt": "2025-06-21T17:45:41.01053Z"
  }
]
```

#### Tasks Endpoint
```http
GET /api/v1/tasks
GET /api/v1/tasks?project_id={projectId}
Headers: X-API-Key: dev-api-key-12345
```

**Response Format:**
```typescript
Task[] = [] // Empty array when no tasks exist
```

#### Functional Blocks Endpoint
```http
GET /api/v1/functional-blocks
Headers: X-API-Key: dev-api-key-12345
```

**Response Format:**
```typescript
FunctionalBlock[] = [
  {
    "id": "717a0daa-021b-46e1-bde5-779814d54e0d",
    "name": "тестирование",
    "prefix": "TST",
    "createdAt": "2025-06-21T17:45:33.964212Z",
    "updatedAt": "2025-06-21T17:45:33.964212Z"
  }
]
```

## ApiService Implementation

### Type Definitions

```typescript
// Extension types
interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface FunctionalBlock {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  updatedAt: string;
}
```

### Corrected ApiService Methods

#### Before (v0.4.4 - Incorrect)
```typescript
async getProjects(): Promise<Project[]> {
  try {
    // ❌ Incorrect: Expected ApiResponse wrapper
    const response: AxiosResponse<ApiResponse<Project[]>> = 
      await this.client.get('/api/v1/projects');
    
    // ❌ Incorrect: Trying to access .data.data
    return response.data.data; // Returns undefined!
  } catch (error) {
    this.logger.error('Failed to fetch projects', error);
    throw error;
  }
}
```

#### After (v0.4.5 - Correct)
```typescript
async getProjects(): Promise<Project[]> {
  try {
    // ✅ Correct: Direct array response
    const response: AxiosResponse<Project[]> = 
      await this.client.get('/api/v1/projects');
    
    // ✅ Correct: Direct access to data
    return response.data; // Returns Project[]
  } catch (error) {
    this.logger.error('Failed to fetch projects', error);
    throw error;
  }
}
```

### Complete Method Implementations

```typescript
export class ApiService implements IApiService {
  private client: AxiosInstance;
  private configService: ConfigurationService;
  private logger: Logger;

  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      const response: AxiosResponse<Project[]> = 
        await this.client.get('/api/v1/projects');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch projects', error);
      throw error;
    }
  }

  async getProject(id: string): Promise<Project> {
    try {
      const response: AxiosResponse<Project> = 
        await this.client.get(`/api/v1/projects/${id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch project ${id}`, error);
      throw error;
    }
  }

  // Tasks
  async getTasks(projectId?: string): Promise<Task[]> {
    try {
      const url = projectId 
        ? `/api/v1/tasks?project_id=${projectId}` 
        : '/api/v1/tasks';
      const response: AxiosResponse<Task[]> = 
        await this.client.get(url);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch tasks', error);
      throw error;
    }
  }

  // Functional Blocks
  async getFunctionalBlocks(): Promise<FunctionalBlock[]> {
    try {
      const response: AxiosResponse<FunctionalBlock[]> = 
        await this.client.get('/api/v1/functional-blocks');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch functional blocks', error);
      throw error;
    }
  }
}
```

## Error Handling

### HTTP Status Codes

| Status Code | Meaning | ApiService Behavior |
|-------------|---------|-------------------|
| 200 | Success | Return response.data |
| 401 | Unauthorized | Log error, throw exception |
| 403 | Forbidden | Log error, throw exception |
| 404 | Not Found | Log error, throw exception |
| 500 | Server Error | Log error, throw exception |

### Network Errors

```typescript
// Axios interceptor handles network errors
this.client.interceptors.response.use(
  (response) => {
    this.logger.debug(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      this.logger.error('🔌 API Connection Error - Server not reachable');
    } else if (error.response?.status >= 500) {
      this.logger.error('🚨 API Server Error');
    } else if (error.response?.status >= 400) {
      this.logger.warn('⚠️ API Client Error');
    }
    return Promise.reject(error);
  }
);
```

## Authentication

### API Key Configuration

```typescript
// ConfigurationService default values
getConfig(): ExtensionConfig {
  return {
    apiUrl: this.config.get<string>('apiUrl', 'http://localhost:8080'),
    apiKey: this.config.get<string>('apiKey', 'dev-api-key-12345'),
    // ... other config
  };
}

// Axios client setup
const client = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    ...(config.apiKey && { 'X-API-Key': config.apiKey })
  }
});
```

## Integration with CacheService

### Data Flow

```
ApiService.getProjects() 
  ↓
Backend API (/api/v1/projects)
  ↓
Direct Array Response: Project[]
  ↓
CacheService.cacheProjects(projects)
  ↓
Tree View Provider displays data
```

### Cache Integration

```typescript
// CachedApiService usage
export class CachedApiService {
  async getProjects(): Promise<Project[]> {
    // Check cache first
    const cached = this.cacheService.getCachedProjects();
    if (cached) {
      return cached;
    }

    // Fetch from API
    const projects = await this.apiService.getProjects();
    
    // Cache the results (projects is now valid array)
    this.cacheService.cacheProjects(projects);
    
    return projects;
  }
}
```

## Testing and Validation

### Manual Testing Commands

```bash
# Test backend API directly
curl -H "X-API-Key: dev-api-key-12345" http://localhost:8080/api/v1/projects
curl -H "X-API-Key: dev-api-key-12345" http://localhost:8080/api/v1/tasks  
curl -H "X-API-Key: dev-api-key-12345" http://localhost:8080/api/v1/functional-blocks

# Expected responses: Direct arrays, not wrapped objects
```

### Extension Testing

1. **Compilation Test:**
   ```bash
   cd vscode-extension
   npm run compile
   # Should complete without TypeScript errors
   ```

2. **Package Creation:**
   ```bash
   npm run package
   # Should create project-master-extension-0.4.5.vsix
   ```

3. **Runtime Validation:**
   - Install extension in Cursor IDE
   - Open Project Master Tree View
   - Verify projects and tasks are displayed
   - Check Developer Console for absence of warnings

## Troubleshooting

### Common Issues

#### Issue: "API returned non-array data" warnings
**Cause:** ApiService expecting ApiResponse wrapper  
**Solution:** Use direct array response types  
**Fixed in:** v0.4.5

#### Issue: Extension shows empty Tree View
**Cause:** Backend not running or API key mismatch  
**Solution:** 
1. Start backend: `docker-compose up -d`
2. Verify API key in extension settings
3. Check network connectivity

#### Issue: 401 Unauthorized errors
**Cause:** Incorrect API key configuration  
**Solution:** Update extension settings with correct API key

### Debug Logging

Enable debug logging in extension settings:
```json
{
  "projectMaster.logLevel": "debug"
}
```

This will provide detailed API request/response logging in the extension output panel.

## Migration Guide

### From v0.4.4 to v0.4.5

**Breaking Changes:** None for end users  
**Internal Changes:** ApiService response handling  

**For Developers:**
1. Update any custom ApiService extensions to use direct array types
2. Remove ApiResponse wrapper expectations
3. Test with actual backend API responses

## Performance Considerations

### Response Size Optimization

- Backend returns minimal data structures
- No unnecessary wrapper objects
- Direct array access reduces memory overhead

### Caching Strategy

- CacheService now receives valid arrays
- TTL-based cache invalidation
- Memory usage estimation works correctly

## Security Considerations

### API Key Management

- API keys stored in extension configuration
- Never logged in debug output
- Transmitted via secure HTTP headers

### Network Security

- HTTPS recommended for production
- API key validation on backend
- Request timeout limits prevent hanging connections

## Future Enhancements

### Planned Improvements

1. **Response Validation:** JSON schema validation for API responses
2. **Retry Logic:** Automatic retry for transient network errors  
3. **Pagination:** Support for paginated API responses
4. **Compression:** Gzip compression for large responses

### API Evolution

Backend API maintains backward compatibility through:
- Consistent response formats
- Versioned endpoints (/api/v1/)
- Graceful handling of missing fields 