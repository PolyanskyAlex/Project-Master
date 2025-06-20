interface ServerInfo {
  port: number;
  baseURL: string;
  status: string;
  startTime: string;
  pid: number;
}

interface ServerDiscoveryResult {
  baseURL: string;
  port: number;
  discovered: boolean;
  method: 'config' | 'file' | 'scan' | 'default';
}

/**
 * Обнаруживает активный backend сервер
 */
export const discoverBackendServer = async (): Promise<ServerDiscoveryResult> => {
  // 1. Проверяем переменную окружения
  const envURL = process.env.REACT_APP_API_URL;
  if (envURL) {
    const isActive = await checkServerHealth(envURL);
    if (isActive) {
      return {
        baseURL: envURL,
        port: extractPortFromURL(envURL),
        discovered: true,
        method: 'config'
      };
    }
  }

  // 2. Проверяем файл server-info.json
  try {
    const serverInfo = await loadServerInfo();
    if (serverInfo) {
      const isActive = await checkServerHealth(serverInfo.baseURL);
      if (isActive) {
        return {
          baseURL: serverInfo.baseURL,
          port: serverInfo.port,
          discovered: true,
          method: 'file'
        };
      }
    }
  } catch (error) {
    console.debug('Файл server-info.json не найден или недоступен');
  }

  // 3. Сканируем стандартные порты
  const commonPorts = [8080, 8081, 8082, 8083, 8084, 8085, 3001, 3002];
  for (const port of commonPorts) {
    const baseURL = `http://localhost:${port}`;
    const isActive = await checkServerHealth(baseURL);
    if (isActive) {
      return {
        baseURL,
        port,
        discovered: true,
        method: 'scan'
      };
    }
  }

  // 4. Возвращаем значение по умолчанию
  return {
    baseURL: 'http://localhost:8080',
    port: 8080,
    discovered: false,
    method: 'default'
  };
};

/**
 * Загружает информацию о сервере из файла
 */
const loadServerInfo = async (): Promise<ServerInfo | null> => {
  try {
    const response = await fetch('/server-info.json', {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const serverInfo: ServerInfo = await response.json();
    return serverInfo;
  } catch (error) {
    return null;
  }
};

/**
 * Проверяет здоровье сервера
 */
const checkServerHealth = async (baseURL: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 секунды таймаут
    
    const response = await fetch(`${baseURL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Извлекает порт из URL
 */
const extractPortFromURL = (url: string): number => {
  try {
    const urlObj = new URL(url);
    return parseInt(urlObj.port) || (urlObj.protocol === 'https:' ? 443 : 80);
  } catch (error) {
    return 8080;
  }
};

/**
 * Периодически проверяет доступность сервера
 */
export const createServerMonitor = (
  onServerChange: (result: ServerDiscoveryResult) => void,
  intervalMs: number = 10000 // 10 секунд
) => {
  let currentBaseURL = '';
  
  const checkServer = async () => {
    const result = await discoverBackendServer();
    
    if (result.baseURL !== currentBaseURL) {
      currentBaseURL = result.baseURL;
      onServerChange(result);
    }
  };
  
  // Первоначальная проверка
  checkServer();
  
  // Периодические проверки
  const intervalId = setInterval(checkServer, intervalMs);
  
  // Возвращаем функцию для остановки мониторинга
  return () => clearInterval(intervalId);
}; 