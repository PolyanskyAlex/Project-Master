import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiError } from '../types/api';
import { logger } from '../utils/logger';
import { discoverBackendServer } from '../utils/serverDiscovery';

// Конфигурация API
let API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const API_KEY = process.env.REACT_APP_API_KEY || 'dev-api-key-123';

// Создание экземпляра axios с базовой инициализацией
let apiClient: AxiosInstance = createApiClient(API_BASE_URL);

// Создание API клиента
function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
  });

  // Интерцептор для обработки ответов
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      const method = response.config.method?.toUpperCase() || 'UNKNOWN';
      const url = response.config.url || 'unknown';
      
      logger.logApiResponse(method, url, response.status, response.data);
      return response;
    },
    (error) => {
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      const url = error.config?.url || 'unknown';
      
      // Обработка ошибок API
      const apiError: ApiError = {
        error: error.response?.status ? `HTTP ${error.response.status}` : 'Network Error',
        message: error.response?.data?.message || error.message,
        details: error.response?.data,
      };

      logger.logApiError(method, url, apiError);
      return Promise.reject(apiError);
    }
  );

  // Интерцептор для обработки запросов
  client.interceptors.request.use(
    (config) => {
      const method = config.method?.toUpperCase() || 'UNKNOWN';
      const url = config.url || 'unknown';
      
      logger.logApiRequest(method, url, config.data);
      return config;
    },
    (error) => {
      logger.error('Request Error', error, 'API');
      return Promise.reject(error);
    }
  );

  return client;
}

// Автоматическое обнаружение и инициализация API
const initializeAPI = async () => {
  try {
    const serverInfo = await discoverBackendServer();
    
    if (serverInfo.baseURL !== API_BASE_URL) {
      API_BASE_URL = serverInfo.baseURL;
      console.log(`🔍 Backend обнаружен: ${API_BASE_URL} (метод: ${serverInfo.method})`);
      
      if (!serverInfo.discovered) {
        console.warn('⚠️ Backend сервер не найден, используется URL по умолчанию');
      }
      
      // Пересоздаем клиент с новым URL
      apiClient = createApiClient(API_BASE_URL);
    }
    
    return serverInfo;
  } catch (error) {
    console.error('Ошибка инициализации API:', error);
    // Fallback к значению по умолчанию
    if (!apiClient) {
      apiClient = createApiClient(API_BASE_URL);
    }
    return {
      baseURL: API_BASE_URL,
      port: 8080,
      discovered: false,
      method: 'default' as const
    };
  }
};

// Инициализируем API при загрузке модуля
initializeAPI();

// Базовые методы API
export class ApiService {
  protected get client() {
    return apiClient;
  }

  // GET запрос
  protected async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  // POST запрос
  protected async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  // PUT запрос
  protected async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  // DELETE запрос
  protected async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

// Проверка здоровья API
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await apiClient.get('/health');
    return true;
  } catch (error) {
    console.error('API Health Check Failed:', error);
    return false;
  }
};

// Получение текущего базового URL
export const getCurrentApiBaseURL = (): string => {
  return API_BASE_URL;
};

// Переинициализация API с новым URL
export const reinitializeAPI = async (baseURL?: string): Promise<void> => {
  if (baseURL) {
    API_BASE_URL = baseURL;
    apiClient = createApiClient(API_BASE_URL);
  } else {
    await initializeAPI();
  }
};

export default apiClient; 