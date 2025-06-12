import * as assert from 'assert';
import * as sinon from 'sinon';
import { CacheService } from '../../../services/CacheService';

describe('CacheService', () => {
    let cacheService: CacheService;
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        clock = sinon.useFakeTimers();
        cacheService = new CacheService(100, 5000); // maxSize: 100, defaultTtl: 5 seconds
    });

    afterEach(() => {
        cacheService.dispose();
        clock.restore();
    });

    describe('Basic Cache Operations', () => {
        it('should store and retrieve data', () => {
            const key = 'test-key';
            const data = { id: 1, name: 'Test' };

            cacheService.set(key, data);
            const result = cacheService.get(key);

            assert.deepStrictEqual(result, data);
        });

        it('should return null for non-existent key', () => {
            const result = cacheService.get('non-existent');
            assert.strictEqual(result, null);
        });

        it('should check if key exists', () => {
            const key = 'test-key';
            const data = { id: 1 };

            assert.strictEqual(cacheService.has(key), false);
            
            cacheService.set(key, data);
            assert.strictEqual(cacheService.has(key), true);
        });

        it('should delete data', () => {
            const key = 'test-key';
            const data = { id: 1 };

            cacheService.set(key, data);
            assert.strictEqual(cacheService.has(key), true);

            const deleted = cacheService.delete(key);
            assert.strictEqual(deleted, true);
            assert.strictEqual(cacheService.has(key), false);
        });

        it('should clear all data', () => {
            cacheService.set('key1', 'data1');
            cacheService.set('key2', 'data2');

            const stats = cacheService.getStats();
            assert.strictEqual(stats.size, 2);

            cacheService.clear();
            const statsAfter = cacheService.getStats();
            assert.strictEqual(statsAfter.size, 0);
        });
    });

    describe('TTL (Time To Live)', () => {
        it('should expire data after TTL', () => {
            const key = 'test-key';
            const data = { id: 1 };

            cacheService.set(key, data, 1000); // 1 second TTL
            assert.deepStrictEqual(cacheService.get(key), data);

            // Advance time by 1.5 seconds
            clock.tick(1500);
            assert.strictEqual(cacheService.get(key), null);
        });

        it('should use default TTL when not specified', () => {
            const key = 'test-key';
            const data = { id: 1 };

            cacheService.set(key, data); // Use default TTL (5 seconds)
            assert.deepStrictEqual(cacheService.get(key), data);

            // Advance time by 4 seconds (should still be valid)
            clock.tick(4000);
            assert.deepStrictEqual(cacheService.get(key), data);

            // Advance time by 2 more seconds (should expire)
            clock.tick(2000);
            assert.strictEqual(cacheService.get(key), null);
        });

        it('should handle custom TTL', () => {
            const key = 'test-key';
            const data = { id: 1 };
            const customTtl = 2000; // 2 seconds

            cacheService.set(key, data, customTtl);
            
            // Should be valid after 1 second
            clock.tick(1000);
            assert.deepStrictEqual(cacheService.get(key), data);

            // Should expire after 2.5 seconds
            clock.tick(1500);
            assert.strictEqual(cacheService.get(key), null);
        });
    });

    describe('Cache Statistics', () => {
        it('should track cache hits and misses', () => {
            const key = 'test-key';
            const data = { id: 1 };

            // Initial stats
            let stats = cacheService.getStats();
            assert.strictEqual(stats.hits, 0);
            assert.strictEqual(stats.misses, 0);
            assert.strictEqual(stats.totalRequests, 0);

            // Cache miss
            cacheService.get(key);
            stats = cacheService.getStats();
            assert.strictEqual(stats.hits, 0);
            assert.strictEqual(stats.misses, 1);
            assert.strictEqual(stats.totalRequests, 1);

            // Set data and cache hit
            cacheService.set(key, data);
            cacheService.get(key);
            stats = cacheService.getStats();
            assert.strictEqual(stats.hits, 1);
            assert.strictEqual(stats.misses, 1);
            assert.strictEqual(stats.totalRequests, 2);
        });

        it('should calculate hit rate correctly', () => {
            const key = 'test-key';
            const data = { id: 1 };

            cacheService.set(key, data);
            
            // 2 hits, 1 miss = 66.67% hit rate
            cacheService.get(key); // hit
            cacheService.get(key); // hit
            cacheService.get('non-existent'); // miss

            const stats = cacheService.getStats();
            assert.strictEqual(Math.round(stats.hitRate), 67);
        });

        it('should track cache size', () => {
            let stats = cacheService.getStats();
            assert.strictEqual(stats.size, 0);

            cacheService.set('key1', 'data1');
            cacheService.set('key2', 'data2');

            stats = cacheService.getStats();
            assert.strictEqual(stats.size, 2);
        });
    });

    describe('Cache Eviction', () => {
        it('should evict oldest entry when max size reached', () => {
            const smallCache = new CacheService(2, 5000); // Max 2 entries

            smallCache.set('key1', 'data1');
            smallCache.set('key2', 'data2');
            
            // Both should exist
            assert.strictEqual(smallCache.get('key1'), 'data1');
            assert.strictEqual(smallCache.get('key2'), 'data2');

            // Adding third entry should evict oldest (key1)
            smallCache.set('key3', 'data3');
            
            assert.strictEqual(smallCache.get('key1'), null); // Evicted
            assert.strictEqual(smallCache.get('key2'), 'data2'); // Still exists
            assert.strictEqual(smallCache.get('key3'), 'data3'); // New entry

            smallCache.dispose();
        });
    });

    describe('Specialized Cache Methods', () => {
        it('should cache and retrieve projects', () => {
            const projects = [
                { 
                    id: '1', 
                    name: 'Project 1', 
                    description: 'Test project 1',
                    status: 'active' as const,
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z'
                },
                { 
                    id: '2', 
                    name: 'Project 2', 
                    description: 'Test project 2',
                    status: 'completed' as const,
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z'
                }
            ];

            cacheService.cacheProjects(projects);
            
            const cachedProjects = cacheService.getCachedProjects();
            assert.deepStrictEqual(cachedProjects, projects);

            // Individual projects should also be cached
            const project1 = cacheService.getCachedProject('1');
            assert.deepStrictEqual(project1, projects[0]);
        });

        it('should cache and retrieve tasks', () => {
            const tasks = [
                { 
                    id: '1', 
                    title: 'Task 1', 
                    description: 'Test task 1',
                    status: 'todo' as const,
                    priority: 'medium' as const,
                    type: 'feature' as const,
                    project_id: 'project-1',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z'
                },
                { 
                    id: '2', 
                    title: 'Task 2', 
                    description: 'Test task 2',
                    status: 'in_progress' as const,
                    priority: 'high' as const,
                    type: 'bug' as const,
                    project_id: 'project-1',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z'
                }
            ];
            const projectId = 'project-1';

            cacheService.cacheTasks(tasks, projectId);
            
            const cachedTasks = cacheService.getCachedTasks(projectId);
            assert.deepStrictEqual(cachedTasks, tasks);

            // Individual tasks should also be cached
            const task1 = cacheService.getCachedTask('1');
            assert.deepStrictEqual(task1, tasks[0]);
        });

        it('should cache and retrieve functional blocks', () => {
            const blocks = [
                { 
                    id: '1', 
                    name: 'Block 1', 
                    description: 'Description 1',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z'
                },
                { 
                    id: '2', 
                    name: 'Block 2', 
                    description: 'Description 2',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z'
                }
            ];

            cacheService.cacheFunctionalBlocks(blocks);
            
            const cachedBlocks = cacheService.getCachedFunctionalBlocks();
            assert.deepStrictEqual(cachedBlocks, blocks);
        });
    });

    describe('Cache Invalidation', () => {
        it('should invalidate cache by pattern', () => {
            cacheService.set('project:1', { id: '1' });
            cacheService.set('project:2', { id: '2' });
            cacheService.set('task:1', { id: '1' });
            cacheService.set('other:1', { id: '1' });

            const deletedCount = cacheService.invalidatePattern('project:.*');
            assert.strictEqual(deletedCount, 2);

            // Project entries should be gone
            assert.strictEqual(cacheService.get('project:1'), null);
            assert.strictEqual(cacheService.get('project:2'), null);

            // Other entries should remain
            assert.notStrictEqual(cacheService.get('task:1'), null);
            assert.notStrictEqual(cacheService.get('other:1'), null);
        });

        it('should invalidate project cache', () => {
            const projectId = 'project-1';
            
            cacheService.set(`project:${projectId}`, { id: projectId });
            cacheService.set(`tasks:project:${projectId}`, []);
            cacheService.set(`documents:project:${projectId}`, []);
            cacheService.set(`plan:project:${projectId}`, []);
            cacheService.set('projects:all', []);

            cacheService.invalidateProject(projectId);

            // All project-related entries should be gone
            assert.strictEqual(cacheService.get(`project:${projectId}`), null);
            assert.strictEqual(cacheService.get(`tasks:project:${projectId}`), null);
            assert.strictEqual(cacheService.get(`documents:project:${projectId}`), null);
            assert.strictEqual(cacheService.get(`plan:project:${projectId}`), null);
            assert.strictEqual(cacheService.get('projects:all'), null);
        });

        it('should invalidate task cache', () => {
            const taskId = 'task-1';
            
            cacheService.set(`task:${taskId}`, { id: taskId });
            cacheService.set(`comments:task:${taskId}`, []);
            cacheService.set('tasks:all', []);
            cacheService.set('tasks:project:1', []);
            cacheService.set('plan:project:1', []);

            cacheService.invalidateTask(taskId);

            // Task and related entries should be gone
            assert.strictEqual(cacheService.get(`task:${taskId}`), null);
            assert.strictEqual(cacheService.get(`comments:task:${taskId}`), null);
            assert.strictEqual(cacheService.get('tasks:all'), null);
            assert.strictEqual(cacheService.get('tasks:project:1'), null);
            assert.strictEqual(cacheService.get('plan:project:1'), null);
        });
    });

    describe('Cache Export and Import', () => {
        it('should export cache data', () => {
            const data1 = { id: 1, name: 'Test 1' };
            const data2 = { id: 2, name: 'Test 2' };

            cacheService.set('key1', data1);
            cacheService.set('key2', data2);

            const exported = cacheService.exportCache();
            
            assert.strictEqual(typeof exported, 'object');
            assert.strictEqual(Object.keys(exported).length, 2);
            assert.strictEqual(exported['key1'].data, data1);
            assert.strictEqual(exported['key2'].data, data2);
            assert.strictEqual(typeof exported['key1'].timestamp, 'string');
            assert.strictEqual(typeof exported['key1'].ttl, 'number');
            assert.strictEqual(typeof exported['key1'].age, 'number');
        });
    });

    describe('Memory Management', () => {
        it('should estimate memory usage', () => {
            const stats1 = cacheService.getStats();
            assert.strictEqual(stats1.memoryUsage, 0);

            cacheService.set('key1', { data: 'test' });
            const stats2 = cacheService.getStats();
            assert.strictEqual(stats2.memoryUsage > 0, true);

            cacheService.set('key2', { data: 'test2' });
            const stats3 = cacheService.getStats();
            assert.strictEqual(stats3.memoryUsage > stats2.memoryUsage, true);
        });
    });

    describe('Cleanup and Disposal', () => {
        it('should clean up expired entries automatically', () => {
            const key1 = 'key1';
            const key2 = 'key2';
            
            cacheService.set(key1, 'data1', 1000); // 1 second TTL
            cacheService.set(key2, 'data2', 3000); // 3 seconds TTL

            // Advance time to expire first entry
            clock.tick(1500);

            // Trigger cleanup (normally done by timer)
            (cacheService as any).cleanup();

            assert.strictEqual(cacheService.get(key1), null); // Expired
            assert.strictEqual(cacheService.get(key2), 'data2'); // Still valid
        });

        it('should dispose properly', () => {
            cacheService.set('key1', 'data1');
            
            const stats = cacheService.getStats();
            assert.strictEqual(stats.size, 1);

            cacheService.dispose();
            
            const statsAfter = cacheService.getStats();
            assert.strictEqual(statsAfter.size, 0);
        });
    });
}); 