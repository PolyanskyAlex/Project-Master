import * as assert from 'assert';
import { CacheService } from '../../../services/CacheService';
import { Logger } from '../../../utils/Logger';

suite('CacheService Regression Tests - B013_EXT', () => {
    let cacheService: CacheService;
    let logger: Logger;

    setup(() => {
        logger = new Logger();
        cacheService = new CacheService(100, 60000);
    });

    teardown(() => {
        cacheService.dispose();
    });

    test('estimateMemoryUsage should handle undefined/null data without errors', () => {
        // Arrange: Добавляем элементы с различными типами данных
        cacheService.set('test-valid', [{ id: '1', name: 'test' }]);
        cacheService.set('test-null', null);
        cacheService.set('test-undefined', undefined);
        cacheService.set('test-empty-array', []);
        cacheService.set('test-empty-object', {});

        // Act & Assert: Вызов estimateMemoryUsage не должен выбрасывать ошибку
        assert.doesNotThrow(() => {
            const stats = cacheService.getStats();
            assert.ok(stats.memoryUsage >= 0, 'Memory usage should be non-negative');
        });
    });

    test('cacheTasks should validate input data and handle invalid inputs gracefully', () => {
        // Test with valid data
        const validTasks = [
            { id: '1', title: 'Task 1', status: 'open' },
            { id: '2', title: 'Task 2', status: 'closed' }
        ];
        
        assert.doesNotThrow(() => {
            cacheService.cacheTasks(validTasks as any);
        });

        // Test with null/undefined
        assert.doesNotThrow(() => {
            cacheService.cacheTasks(null as any);
            cacheService.cacheTasks(undefined as any);
        });

        // Test with non-array data
        assert.doesNotThrow(() => {
            cacheService.cacheTasks('invalid' as any);
            cacheService.cacheTasks(123 as any);
            cacheService.cacheTasks({} as any);
        });
    });

    test('cache should remain functional after handling invalid data', () => {
        // Add invalid data
        cacheService.set('invalid-data', undefined);
        cacheService.cacheTasks(null as any);
        
        // Add valid data
        const validTasks = [{ id: '1', title: 'Valid Task' }];
        cacheService.cacheTasks(validTasks as any);
        
        // Verify cache is still functional
        const retrieved = cacheService.getCachedTasks();
        assert.ok(Array.isArray(retrieved), 'Should retrieve valid cached tasks');
        assert.strictEqual(retrieved?.length, 1, 'Should have one task');
        assert.strictEqual(retrieved?.[0].id, '1', 'Should retrieve correct task');
    });

    test('JSON.stringify edge cases should be handled in estimateMemoryUsage', () => {
        // Create data that might cause JSON.stringify to fail
        const circularRef: any = { name: 'circular' };
        circularRef.self = circularRef;
        
        // This should not throw an error due to try-catch in estimateMemoryUsage
        assert.doesNotThrow(() => {
            cacheService.set('circular', circularRef);
            const stats = cacheService.getStats();
            assert.ok(stats.memoryUsage >= 0);
        });
    });

    test('memory usage calculation should be consistent and non-negative', () => {
        // Empty cache
        let stats = cacheService.getStats();
        assert.strictEqual(stats.memoryUsage, 0, 'Empty cache should have zero memory usage');

        // Add various data types
        cacheService.set('string', 'test');
        cacheService.set('number', 42);
        cacheService.set('array', [1, 2, 3]);
        cacheService.set('object', { key: 'value' });
        cacheService.set('null', null);
        cacheService.set('undefined', undefined);

        stats = cacheService.getStats();
        assert.ok(stats.memoryUsage > 0, 'Cache with data should have positive memory usage');
        
        // Multiple calls should return consistent results
        const usage1 = cacheService.getStats().memoryUsage;
        const usage2 = cacheService.getStats().memoryUsage;
        assert.strictEqual(usage1, usage2, 'Memory usage calculation should be consistent');
    });
}); 