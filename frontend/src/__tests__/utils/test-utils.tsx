import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { NotificationProvider } from '../../contexts/NotificationContext';

const theme = createTheme();

// Создаем провайдер для всех тестов
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Кастомная функция render с провайдерами
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Экспортируем все из testing-library
export * from '@testing-library/react';

// Переопределяем render
export { customRender as render };

// Утилиты для тестирования
export const mockApiResponse = <T,>(data: T, delay = 0): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const mockApiError = (message: string, status = 500, delay = 0): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message) as any;
      error.response = { status, data: { message } };
      reject(error);
    }, delay);
  });
};

// Моки для localStorage
export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Утилита для ожидания асинхронных операций
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Моки для window.location
export const mockLocation = (url: string) => {
  delete (window as any).location;
  window.location = new URL(url) as any;
};

// Утилита для создания тестовых данных
export const createMockData = {
  functionalBlock: (overrides = {}) => ({
    id: 1,
    name: 'Test Block',
    prefix: 'TB',
    description: 'Test functional block',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),
  
  project: (overrides = {}) => ({
    id: 1,
    name: 'Test Project',
    description: 'Test project description',
    status: 'active' as const,
    functional_block_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    functional_block: createMockData.functionalBlock(),
    ...overrides,
  }),
  
  task: (overrides = {}) => ({
    id: 1,
    task_number: 'TASK-000001',
    title: 'Test Task',
    description: 'Test task description',
    status: 'todo' as const,
    priority: 'medium' as const,
    type: 'feature' as const,
    project_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    project: createMockData.project(),
    ...overrides,
  }),
  
  comment: (overrides = {}) => ({
    id: 1,
    content: 'Test comment',
    task_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),
  
  document: (overrides = {}) => ({
    id: 1,
    title: 'Test Document',
    content: 'Test document content',
    type: 'BRD' as const,
    project_id: 1,
    agent_editable: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),
  
  operationLog: (overrides = {}) => ({
    id: 1,
    operation_type: 'CREATE' as const,
    entity_type: 'task',
    entity_id: 1,
    description: 'Test operation',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),
}; 