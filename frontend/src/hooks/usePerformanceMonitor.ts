import { useEffect, useRef, useCallback } from 'react';
import { logger } from '../utils/logger';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: Date;
}

interface UsePerformanceMonitorOptions {
  componentName: string;
  logThreshold?: number; // Логировать только если время рендера больше этого значения (мс)
  enabled?: boolean;
}

export const usePerformanceMonitor = ({
  componentName,
  logThreshold = 100,
  enabled = process.env.NODE_ENV === 'development'
}: UsePerformanceMonitorOptions) => {
  const renderStartTime = useRef<number>(0);
  const mountTime = useRef<number>(0);

  // Засекаем время начала рендера
  const startRender = useCallback(() => {
    if (!enabled) return;
    renderStartTime.current = performance.now();
  }, [enabled]);

  // Засекаем время окончания рендера
  const endRender = useCallback(() => {
    if (!enabled || renderStartTime.current === 0) return;
    
    const renderTime = performance.now() - renderStartTime.current;
    
    if (renderTime > logThreshold) {
      const metrics: PerformanceMetrics = {
        renderTime,
        componentName,
        timestamp: new Date()
      };
      
      logger.warn(`Slow render detected in ${componentName}`, {
        renderTimeMs: `${renderTime.toFixed(2)}ms`,
        threshold: `${logThreshold}ms`,
        componentName,
        timestamp: metrics.timestamp
      }, 'Performance');
    }
    
    renderStartTime.current = 0;
  }, [enabled, logThreshold, componentName]);

  // Отслеживаем время монтирования компонента
  useEffect(() => {
    if (!enabled) return;
    
    mountTime.current = performance.now();
    
    logger.debug(`Component ${componentName} mounted`, {
      mountTime: mountTime.current
    }, 'Performance');

    return () => {
      const unmountTime = performance.now();
      const lifeTime = unmountTime - mountTime.current;
      
      logger.debug(`Component ${componentName} unmounted`, {
        lifeTime: `${lifeTime.toFixed(2)}ms`,
        mountTime: mountTime.current,
        unmountTime
      }, 'Performance');
    };
  }, [enabled, componentName]);

  // Автоматически засекаем время рендера при каждом рендере
  useEffect(() => {
    startRender();
    
    // Используем setTimeout для измерения времени после завершения рендера
    const timeoutId = setTimeout(() => {
      endRender();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  });

  return {
    startRender,
    endRender
  };
};

// Хук для измерения времени выполнения функций
export const usePerformanceTimer = (enabled: boolean = process.env.NODE_ENV === 'development') => {
  const measureFunction = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    functionName: string,
    logThreshold: number = 50
  ) => {
    return (...args: T): R => {
      if (!enabled) {
        return fn(...args);
      }

      const startTime = performance.now();
      const result = fn(...args);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      if (executionTime > logThreshold) {
        logger.warn(`Slow function execution: ${functionName}`, {
          executionTime: `${executionTime.toFixed(2)}ms`,
          threshold: `${logThreshold}ms`,
          functionName
        }, 'Performance');
      } else {
        logger.debug(`Function execution: ${functionName}`, {
          executionTime: `${executionTime.toFixed(2)}ms`,
          functionName
        }, 'Performance');
      }

      return result;
    };
  }, [enabled]);

  const measureAsyncFunction = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    functionName: string,
    logThreshold: number = 100
  ) => {
    return async (...args: T): Promise<R> => {
      if (!enabled) {
        return fn(...args);
      }

      const startTime = performance.now();
      try {
        const result = await fn(...args);
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        if (executionTime > logThreshold) {
          logger.warn(`Slow async function execution: ${functionName}`, {
            executionTime: `${executionTime.toFixed(2)}ms`,
            threshold: `${logThreshold}ms`,
            functionName,
            status: 'success'
          }, 'Performance');
        } else {
          logger.debug(`Async function execution: ${functionName}`, {
            executionTime: `${executionTime.toFixed(2)}ms`,
            functionName,
            status: 'success'
          }, 'Performance');
        }

        return result;
      } catch (error) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        logger.error(`Async function error: ${functionName}`, {
          executionTime: `${executionTime.toFixed(2)}ms`,
          functionName,
          status: 'error',
          error
        }, 'Performance');

        throw error;
      }
    };
  }, [enabled]);

  return {
    measureFunction,
    measureAsyncFunction
  };
};

// Хук для мониторинга памяти (если поддерживается браузером)
export const useMemoryMonitor = (
  intervalMs: number = 30000,
  enabled: boolean = process.env.NODE_ENV === 'development'
) => {
  useEffect(() => {
    if (!enabled || !('memory' in performance)) {
      return;
    }

    const logMemoryUsage = () => {
      const memory = (performance as any).memory;
      
      logger.info('Memory usage', {
        usedJSHeapSize: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        totalJSHeapSize: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        usagePercentage: `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2)}%`
      }, 'Memory');
    };

    // Логируем сразу
    logMemoryUsage();

    // Устанавливаем интервал
    const intervalId = setInterval(logMemoryUsage, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [intervalMs, enabled]);
}; 