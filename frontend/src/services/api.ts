import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiError } from '../types/api';
import { logger } from '../utils/logger';

// Конфигурация API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const API_KEY = process.env.REACT_APP_API_KEY || 'your-api-key-here';

// Создание экземпляра axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
});

// Интерцептор для обработки ответов
apiClient.interceptors.response.use(
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
apiClient.interceptors.request.use(
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

// Базовые методы API
export class ApiService {
  protected client = apiClient;

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

export default apiClient; 